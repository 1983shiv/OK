import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPlanLimits } from '../plan/plan.constants';

@Injectable()
export class WatchlistService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(userId: string) {
    return this.prismaService.client.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(
    userId: string,
    data: {
      instrumentKey: string;
      symbol: string;
      strikePrice: number;
      optionType: 'CE' | 'PE';
      expiryDate: string;
    },
  ) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const limits = getPlanLimits(user.plan);
    const currentCount = await this.prismaService.client.watchlistItem.count({
      where: { userId },
    });

    if (currentCount >= limits.watchlistItems) {
      throw new BadRequestException(
        `Watchlist limit reached (${limits.watchlistItems} items). Upgrade your plan to add more.`,
      );
    }

    return this.prismaService.client.watchlistItem.create({
      data: {
        userId,
        instrumentKey: data.instrumentKey,
        symbol: data.symbol,
        strikePrice: data.strikePrice,
        optionType: data.optionType,
        expiryDate: new Date(data.expiryDate),
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prismaService.client.watchlistItem.findFirst({
      where: { id, userId },
    });

    if (!item) throw new BadRequestException('Watchlist item not found');

    await this.prismaService.client.watchlistItem.delete({ where: { id } });
    return { success: true };
  }
}
