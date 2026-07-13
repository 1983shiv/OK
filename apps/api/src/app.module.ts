import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PlanModule } from './modules/plan/plan.module';
import { MongooseSchemasModule } from './mongoose/mongoose-schemas.module';
import { MarketModule } from './modules/market/market.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseSchemasModule,
    HealthModule,
    AuthModule,
    UserModule,
    PlanModule,
    MarketModule,
    WatchlistModule,
    AlertsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
