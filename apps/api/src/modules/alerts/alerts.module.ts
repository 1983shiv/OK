import { Module, forwardRef } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertEvaluator } from './alerts.evaluator';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [forwardRef(() => MarketModule)],
  controllers: [AlertsController],
  providers: [AlertsService, AlertEvaluator],
  exports: [AlertsService, AlertEvaluator],
})
export class AlertsModule {}
