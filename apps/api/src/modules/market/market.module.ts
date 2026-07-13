import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketCacheService } from './market-cache.service';
import { MockDataService } from './mock-data.service';
import { UpstoxService } from './upstox.service';

@Module({
  controllers: [MarketController],
  providers: [
    MarketService,
    MarketCacheService,
    MockDataService,
    UpstoxService,
  ],
  exports: [MarketService],
})
export class MarketModule {}
