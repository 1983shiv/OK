import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { getPlanLimits } from '../plan/plan.constants';

function todayDateString(): string {
  const d = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  return ist.toISOString().slice(0, 10);
}

function midnightISTTimestamp(): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  ist.setHours(0, 0, 0, 0);
  return Math.floor((ist.getTime() - istOffset) / 1000) + 86400;
}

@Injectable()
export class QuotaService {
  constructor(private readonly redisService: RedisService) {}

  async checkAndDeduct(
    userId: string,
    plan: string,
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const limits = getPlanLimits(plan);
    const limit = limits.aiQueriesPerDay;
    const key = `ok:ai:quota:${userId}:${todayDateString()}`;
    const client = this.redisService.getClient();

    try {
      const used = await client.incr(key);
      if (used === 1) {
        await client.expireat(key, midnightISTTimestamp());
      }
      if (used > limit) {
        await client.decr(key);
        return { allowed: false, remaining: 0, limit };
      }
      return { allowed: true, remaining: limit - used, limit };
    } catch {
      return { allowed: true, remaining: limit, limit };
    }
  }

  async getUsage(
    userId: string,
    plan: string,
  ): Promise<{ used: number; remaining: number; limit: number }> {
    const limits = getPlanLimits(plan);
    const limit = limits.aiQueriesPerDay;
    const key = `ok:ai:quota:${userId}:${todayDateString()}`;
    const client = this.redisService.getClient();

    try {
      const usedStr = await client.get(key);
      const used = usedStr ? parseInt(usedStr, 10) : 0;
      return { used, remaining: Math.max(0, limit - used), limit };
    } catch {
      return { used: 0, remaining: limit, limit };
    }
  }
}
