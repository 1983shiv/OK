import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    @InjectConnection() private readonly mongooseConnection: Connection,
  ) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    const [postgresResult, redisResult] = await Promise.allSettled([
      this.prismaService.ping(),
      this.redisService.ping(),
    ]);

    const mongooseUp = this.mongooseConnection.readyState === 1;

    const services = {
      postgres:
        postgresResult.status === 'fulfilled' && postgresResult.value
          ? 'up'
          : 'down',
      redis:
        redisResult.status === 'fulfilled' && redisResult.value ? 'up' : 'down',
      mongodb: mongooseUp ? 'up' : 'down',
    };

    const status = Object.values(services).every((s) => s === 'up')
      ? 'ok'
      : 'degraded';

    return {
      status,
      services,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
