import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { QuotaService } from './quota.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { AiDailyBriefWorker } from './ai-daily-brief.worker';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    QuotaService,
    ContextBuilderService,
    PromptBuilderService,
    AiDailyBriefWorker,
  ],
  exports: [AiService, QuotaService],
})
export class AiModule {}
