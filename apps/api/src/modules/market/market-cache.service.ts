import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const CACHE_PREFIX = 'ok:live';
const CHAIN_TTL = 90;
const DASHBOARD_TTL = 90;
const SPOT_TTL = 30;

@Injectable()
export class MarketCacheService {
  constructor(private readonly redisService: RedisService) {}

  private key(domain: string, index: string): string {
    return `${CACHE_PREFIX}:${domain}:${index}`;
  }

  async getChain(index: string): Promise<string | null> {
    return this.redisService.getClient().get(this.key('chain', index));
  }

  async setChain(index: string, data: string): Promise<void> {
    await this.redisService
      .getClient()
      .setex(this.key('chain', index), CHAIN_TTL, data);
  }

  async getDashboard(index: string): Promise<string | null> {
    return this.redisService.getClient().get(this.key('dashboard', index));
  }

  async setDashboard(index: string, data: string): Promise<void> {
    await this.redisService
      .getClient()
      .setex(this.key('dashboard', index), DASHBOARD_TTL, data);
  }

  async getSpot(index: string): Promise<string | null> {
    return this.redisService.getClient().get(this.key('spot', index));
  }

  async setSpot(index: string, data: string): Promise<void> {
    await this.redisService
      .getClient()
      .setex(this.key('spot', index), SPOT_TTL, data);
  }
}
