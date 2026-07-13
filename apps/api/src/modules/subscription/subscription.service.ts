import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RAZORPAY_PLAN_IDS, PLAN_PRICES_PAISE } from './config/razorpay-plans';
import Razorpay from 'razorpay';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly razorpay: Razorpay | null = null;
  private readonly webhookSecret: string | null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret =
      this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') ?? null;

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn(
        'Razorpay not configured — using mock mode for subscription creation',
      );
    }
  }

  isConfigured(): boolean {
    return this.razorpay !== null;
  }

  async createSubscription(
    userId: string,
    planId: string,
    billingCycle: string,
  ) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const existing = await this.prismaService.client.subscription.findUnique({
      where: { userId },
    });
    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('User already has an active subscription');
    }

    const planKey = planId.toLowerCase();
    const rzPlanId =
      RAZORPAY_PLAN_IDS[planKey]?.[billingCycle as 'monthly' | 'yearly'];
    const amountPaise =
      PLAN_PRICES_PAISE[planKey]?.[billingCycle as 'monthly' | 'yearly'];

    if (!rzPlanId || !amountPaise) {
      throw new BadRequestException(`Invalid plan or billing cycle`);
    }

    let subscriptionId: string;
    if (this.razorpay) {
      try {
        const rzSub = await this.razorpay.subscriptions.create({
          plan_id: rzPlanId,
          customer_notify: 1,
          quantity: 1,
          total_count: billingCycle === 'monthly' ? 12 : 1,
          notes: { userId, internalPlanName: planId },
        });
        subscriptionId = rzSub.id;
      } catch (err) {
        this.logger.error('Razorpay subscription creation failed', err);
        throw new BadRequestException('Failed to create subscription');
      }
    } else {
      subscriptionId = `mock_sub_${Date.now()}`;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(
      periodEnd.getMonth() + (billingCycle === 'monthly' ? 1 : 12),
    );

    const subscription = await this.prismaService.client.subscription.create({
      data: {
        userId,
        plan: planId.toUpperCase(),
        status: this.razorpay ? 'CREATED' : 'ACTIVE',
        razorpaySubscriptionId: subscriptionId,
        razorpayPlanId: rzPlanId,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return {
      subscriptionId: subscription.razorpaySubscriptionId,
      razorpayKeyId:
        this.configService.get<string>('RAZORPAY_KEY_ID') ?? 'mock_key_id',
      prefill: { email: user.email, name: user.name ?? '' },
    };
  }

  async cancelSubscription(userId: string) {
    const subscription =
      await this.prismaService.client.subscription.findUnique({
        where: { userId },
      });
    if (!subscription)
      throw new NotFoundException('No active subscription found');
    if (subscription.status === 'CANCELLED')
      throw new BadRequestException('Subscription already cancelled');

    if (
      this.razorpay &&
      subscription.razorpaySubscriptionId?.startsWith('sub_')
    ) {
      try {
        await this.razorpay.subscriptions.cancel(
          subscription.razorpaySubscriptionId,
        );
      } catch (err) {
        this.logger.error('Razorpay cancellation failed', err);
      }
    }

    return this.prismaService.client.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (this.webhookSecret) {
      const isValid = Razorpay.validateWebhookSignature(
        rawBody,
        signature,
        this.webhookSecret,
      );
      if (!isValid)
        throw new UnauthorizedException('Invalid webhook signature');
    } else {
      this.logger.warn(
        'RAZORPAY_WEBHOOK_SECRET not set — skipping signature validation',
      );
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const eventId = (event as { event_id?: string }).event_id;
    if (!eventId) throw new BadRequestException('Missing event_id');

    const exists = await this.prismaService.client.webhookEvent.findUnique({
      where: { eventId },
    });
    if (exists) return { received: true, duplicate: true };

    await this.prismaService.client.webhookEvent.create({
      data: {
        source: 'RAZORPAY',
        eventType: (event as { event?: string }).event ?? 'unknown',
        eventId,
        rawBody,
        status: 'RECEIVED',
      },
    });

    const eventType = (event as { event?: string }).event;
    const payload = (event as { payload?: Record<string, unknown> }).payload;
    if (eventType && payload) {
      await this.processWebhookEvent(eventType, payload);
    }

    await this.prismaService.client.webhookEvent.update({
      where: { eventId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });

    return { received: true, duplicate: false };
  }

  private async processWebhookEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const subPayload = payload as {
      subscription?: { id?: string };
    };
    const rzSubId = subPayload.subscription?.id;
    if (!rzSubId) return;

    const subscription = await this.prismaService.client.subscription.findFirst(
      {
        where: { razorpaySubscriptionId: rzSubId },
      },
    );
    if (!subscription) return;

    const planName = subscription.plan;

    switch (eventType) {
      case 'subscription.charged':
      case 'subscription.activated':
        await this.prismaService.client.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
        await this.prismaService.client.user.update({
          where: { id: subscription.userId },
          data: { plan: planName },
        });
        await this.createPaymentRecord(
          subscription.userId,
          subscription.id,
          payload,
        );
        break;

      case 'subscription.halted':
      case 'subscription.cancelled':
        await this.prismaService.client.subscription.update({
          where: { id: subscription.id },
          data: {
            status:
              eventType === 'subscription.cancelled' ? 'CANCELLED' : 'EXPIRED',
          },
        });
        break;

      case 'payment.failed':
        this.logger.warn(`Payment failed for subscription ${rzSubId}`);
        break;
    }
  }

  private async createPaymentRecord(
    userId: string,
    subscriptionId: string,
    payload: Record<string, unknown>,
  ) {
    const payment = (
      payload as {
        payment?: {
          id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          order_id?: string;
          invoice_id?: string;
        };
      }
    ).payment;
    if (!payment?.id) return;

    await this.prismaService.client.payment.create({
      data: {
        userId,
        subscriptionId,
        amount: payment.amount ?? 0,
        currency: payment.currency ?? 'INR',
        status: (payment.status ?? 'captured').toUpperCase(),
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id ?? null,
        invoiceUrl: payment.invoice_id ?? null,
      },
    });
  }
}
