import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface MarketContext {
  index: string;
  timestamp: string;
  spotPrice: number;
  priceChangePct: number;
  pcr: number;
  maxPain: number;
  totalCallOi: number;
  totalPutOi: number;
  sentiment: string;
  sentimentScore: number;
  topCallBuildup: Array<{ strike: number; oiChange: number }>;
  topPutBuildup: Array<{ strike: number; oiChange: number }>;
  unusualActivity: Array<Record<string, unknown>>;
}

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(private readonly redisService: RedisService) {}

  async build(index: string): Promise<MarketContext | null> {
    try {
      const client = this.redisService.getClient();
      const dashJson = await client.get(`ok:live:${index}:dashboard`);

      if (dashJson) {
        const dash = JSON.parse(dashJson);
        return {
          index,
          timestamp: dash.fetchedAt ?? new Date().toISOString(),
          spotPrice: dash.spotPrice ?? 0,
          priceChangePct: dash.priceChangePct ?? 0,
          pcr: dash.pcr ?? 1.0,
          maxPain: dash.maxPain ?? 0,
          totalCallOi: dash.totalCallOi ?? 0,
          totalPutOi: dash.totalPutOi ?? 0,
          sentiment: dash.sentiment ?? 'NEUTRAL',
          sentimentScore: dash.sentimentScore ?? 50,
          topCallBuildup: (dash.topCallBuildup ?? []).slice(0, 3),
          topPutBuildup: (dash.topPutBuildup ?? []).slice(0, 3),
          unusualActivity: dash.unusualActivity ?? [],
        };
      }

      return null;
    } catch (err) {
      this.logger.error(`Failed to build context for ${index}`, err);
      return null;
    }
  }
}
