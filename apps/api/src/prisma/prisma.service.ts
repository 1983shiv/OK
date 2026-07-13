import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prismaClient!: PrismaClient;

  constructor() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prismaClient = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
    });
  }

  get client(): PrismaClient {
    return this.prismaClient;
  }

  async onModuleInit() {
    await this.prismaClient.$connect();
    this.logger.log('PostgreSQL connected');
  }

  async onModuleDestroy() {
    await this.prismaClient.$disconnect();
    this.logger.log('PostgreSQL disconnected');
  }

  async ping(): Promise<boolean> {
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
