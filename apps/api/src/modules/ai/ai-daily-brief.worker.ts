import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { isMarketOpen } from '@optionkart/utils';
import { DailySummary } from '../../mongoose/daily-summary.schema';
import { OISnapshot } from '../../mongoose/oi-snapshot.schema';
import { PromptBuilderService } from './prompt-builder.service';

@Injectable()
export class AiDailyBriefWorker {
  private readonly logger = new Logger(AiDailyBriefWorker.name);
  private openai: OpenAI | null = null;

  private readonly SUPPORTED_INDICES = ['NIFTY', 'BANKNIFTY'];

  constructor(
    private readonly configService: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
    @InjectModel(DailySummary.name)
    private readonly dailySummaryModel: Model<DailySummary>,
    @InjectModel(OISnapshot.name)
    private readonly oiSnapshotModel: Model<OISnapshot>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  @Cron('35 15 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async generateDailyBriefs() {
    if (isMarketOpen(new Date())) return;

    for (const index of this.SUPPORTED_INDICES) {
      await this.generateBrief(index).catch((err) =>
        this.logger.error(`Failed to generate brief for ${index}`, err),
      );
    }
  }

  private async generateBrief(index: string): Promise<void> {
    if (!this.openai) {
      this.logger.warn(
        'OpenAI not configured — skipping daily brief generation',
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const existing = await this.dailySummaryModel
      .findOne({ symbol: index, date: today })
      .lean();

    if (existing?.aiSummary) {
      this.logger.log(`Daily brief already exists for ${index} today`);
      return;
    }

    const snapshots = await this.oiSnapshotModel
      .find({ index })
      .sort({ fetchedAt: -1 })
      .limit(20)
      .lean();

    if (snapshots.length === 0) {
      this.logger.warn(`No data available for ${index} daily brief`);
      return;
    }

    const summaryData: Record<string, unknown> = {
      index,
      date: today,
      snapshotCount: snapshots.length,
      firstSnapshot: snapshots[snapshots.length - 1],
      lastSnapshot: snapshots[0],
    };

    const prompt = this.promptBuilder.buildDailyBriefPrompt(index, summaryData);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      const aiSummary = response.choices[0]?.message?.content ?? '';

      if (aiSummary) {
        await this.dailySummaryModel.updateOne(
          { symbol: index, date: today },
          {
            $set: {
              symbol: index,
              date: today,
              aiSummary,
              openPcr: (snapshots[0] as any)?.pcr ?? 0,
              closePcr: (snapshots[snapshots.length - 1] as any)?.pcr ?? 0,
              spotOpen: (snapshots[0] as any)?.spotPrice ?? 0,
              spotClose:
                (snapshots[snapshots.length - 1] as any)?.spotPrice ?? 0,
            } as any,
          },
          { upsert: true },
        );

        this.logger.log(`Daily brief generated for ${index}`);
      }
    } catch (err) {
      this.logger.error(`OpenAI daily brief error for ${index}`, err);
    }
  }
}
