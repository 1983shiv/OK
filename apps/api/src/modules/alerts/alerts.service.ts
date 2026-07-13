import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPlanLimits } from '../plan/plan.constants';
import { AlertEvaluator } from './alerts.evaluator';
import { MarketService } from '../market/market.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly alertEvaluator: AlertEvaluator,
    private readonly marketService: MarketService,
  ) {}

  async list(userId: string) {
    return this.prismaService.client.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    data: {
      alertType: string;
      symbol: string;
      strikePrice?: number;
      optionType?: string;
      conditionOperator: string;
      conditionValue: number;
      deliveryChannels: string[];
      isActive?: boolean;
    },
  ) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const limits = getPlanLimits(user.plan);
    const currentCount = await this.prismaService.client.alert.count({
      where: { userId },
    });

    if (currentCount >= limits.alerts) {
      throw new BadRequestException(
        `Alert limit reached (${limits.alerts} alerts). Upgrade your plan to add more.`,
      );
    }

    return this.prismaService.client.alert.create({
      data: {
        userId,
        alertType: data.alertType,
        symbol: data.symbol,
        strikePrice: data.strikePrice ?? null,
        optionType: data.optionType ?? null,
        conditionOperator: data.conditionOperator,
        conditionValue: data.conditionValue,
        deliveryChannels: JSON.stringify(data.deliveryChannels),
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    userId: string,
    alertId: string,
    data: Partial<{
      alertType: string;
      symbol: string;
      strikePrice: number | null;
      optionType: string | null;
      conditionOperator: string;
      conditionValue: number;
      deliveryChannels: string[];
      isActive: boolean;
    }>,
  ) {
    const alert = await this.prismaService.client.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) throw new NotFoundException('Alert not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.deliveryChannels) {
      updateData.deliveryChannels = JSON.stringify(data.deliveryChannels);
    }

    return this.prismaService.client.alert.update({
      where: { id: alertId },
      data: updateData,
    });
  }

  async remove(userId: string, alertId: string) {
    const alert = await this.prismaService.client.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) throw new NotFoundException('Alert not found');

    await this.prismaService.client.alert.delete({ where: { id: alertId } });
    return { success: true };
  }

  async getHistory(userId: string, limit = 50) {
    return this.prismaService.client.alertHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { alert: { select: { alertType: true, symbol: true } } },
    });
  }

  async evaluateAndFire(alertId: string): Promise<boolean> {
    const alert = await this.prismaService.client.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert || !alert.isActive) return false;

    const currentValue = await this.getCurrentValue(alert);
    if (currentValue === null) return false;

    const result = this.alertEvaluator.evaluate(alert, currentValue);
    if (!result.triggered) return false;

    await this.prismaService.client.alert.update({
      where: { id: alertId },
      data: { lastTriggeredAt: new Date() },
    });

    await this.prismaService.client.alertHistory.create({
      data: {
        alertId,
        userId: alert.userId,
        triggerValue: currentValue,
        message: result.message,
        channels: alert.deliveryChannels,
      },
    });

    return true;
  }

  private async getCurrentValue(alert: {
    alertType: string;
    symbol: string;
    strikePrice: number | null;
  }): Promise<number | null> {
    try {
      const dash = await this.marketService.getDashboard(alert.symbol);

      switch (alert.alertType) {
        case 'PCR_CROSS':
          return dash.pcr;
        case 'OI_SPIKE':
          return alert.strikePrice
            ? dash.totalCallOI + dash.totalPutOI
            : dash.totalCallOI + dash.totalPutOI;
        case 'MAX_PAIN_SHIFT':
          return dash.maxPain;
        default:
          return dash.pcr;
      }
    } catch {
      return null;
    }
  }
}
