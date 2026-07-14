import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { QuotaService } from './quota.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { AiConversation } from '../../mongoose/ai-conversation.schema';
import { DailySummary } from '../../mongoose/daily-summary.schema';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { getPlanLimits } from '../plan/plan.constants';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (tokensUsed: number, creditsRemaining: number) => void;
  onError: (error: Error) => void;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private platformOpenai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly quotaService: QuotaService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly encryptionService: EncryptionService,
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversation>,
    @InjectModel(DailySummary.name)
    private readonly dailySummaryModel: Model<DailySummary>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
      this.platformOpenai = new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      });
    }
  }

  private async getClient(userId: string): Promise<OpenAI | null> {
    if (this.platformOpenai) return this.platformOpenai;

    try {
      const prefs = await this.prismaService.client.userPreferences.findUnique({
        where: { userId },
        select: { byoOpenaiKey: true },
      });

      if (prefs?.byoOpenaiKey) {
        const decrypted = this.encryptionService.decrypt(prefs.byoOpenaiKey);
        if (decrypted && decrypted.startsWith('sk-')) {
          return new OpenAI({ apiKey: decrypted });
        }
      }
    } catch {
      // fall through to null
    }

    return null;
  }

  private async getCachedResponse(
    index: string,
    query: string,
  ): Promise<string | null> {
    try {
      const hash = createHash('sha256')
        .update(`${index}:${query.toLowerCase().trim()}`)
        .digest('hex');
      return this.redisService.getClient().get(`ok:ai:cache:${hash}`);
    } catch {
      return null;
    }
  }

  private async setCachedResponse(
    index: string,
    query: string,
    response: string,
  ): Promise<void> {
    try {
      const hash = createHash('sha256')
        .update(`${index}:${query.toLowerCase().trim()}`)
        .digest('hex');
      await this.redisService
        .getClient()
        .setex(`ok:ai:cache:${hash}`, 180, response);
    } catch {
      // Cache best-effort
    }
  }

  isConfigured(): boolean {
    return this.platformOpenai !== null;
  }

  async streamChat(
    userId: string,
    plan: string,
    query: string,
    index: string | undefined,
    sessionId: string | undefined,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const quota = await this.quotaService.checkAndDeduct(userId, plan);
    if (!quota.allowed) {
      callbacks.onError(
        new HttpException(
          {
            code: 'AI_QUOTA_EXCEEDED',
            message: `Daily limit of ${quota.limit} queries reached. Upgrade your plan for more.`,
            upgrade_url: '/pricing',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      return;
    }

    const client = await this.getClient(userId);
    if (!client) {
      callbacks.onToken(
        'AI is not configured. Set OPENAI_API_KEY in environment variables or add your own key in Settings (Elite plan).',
      );
      callbacks.onDone(0, quota.remaining);
      return;
    }

    const idx = index ?? 'NIFTY';
    const cached = await this.getCachedResponse(idx, query);
    if (cached) {
      callbacks.onToken(cached);
      callbacks.onDone(0, quota.remaining);
      return;
    }

    const session = sessionId ?? crypto.randomUUID();
    const context = await this.contextBuilder.build(idx);
    const history = await this.getConversationHistory(session, userId);

    const systemPrompt = this.promptBuilder.buildChatPrompt(
      context,
      query,
      history,
    );

    try {
      const stream = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
        stream: true,
        max_tokens: 500,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? '';
        if (content) {
          fullResponse += content;
          callbacks.onToken(content);
        }
      }

      const tokensUsed = Math.ceil(fullResponse.length / 4);

      await this.saveConversation(session, userId, query, fullResponse);
      await this.setCachedResponse(idx, query, fullResponse);

      callbacks.onDone(tokensUsed, quota.remaining);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`OpenAI streaming error: ${message}`, err);
      callbacks.onError(
        new HttpException(
          `AI service unavailable: ${message}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    }
  }

  async suggestStrategy(
    userId: string,
    plan: string,
    index: string,
  ): Promise<{ strategy: string; creditsRemaining: number }> {
    const quota = await this.quotaService.checkAndDeduct(userId, plan);
    if (!quota.allowed) {
      throw new HttpException(
        {
          code: 'AI_QUOTA_EXCEEDED',
          message: `Daily limit of ${quota.limit} queries reached. Upgrade your plan for more.`,
          upgrade_url: '/pricing',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const client = await this.getClient(userId);
    if (!client) {
      return {
        strategy:
          'AI is not configured. Set OPENAI_API_KEY in environment variables or add your own key in Settings (Elite plan).',
        creditsRemaining: quota.remaining,
      };
    }

    const context = await this.contextBuilder.build(index);
    const dte = this.calculateDaysToExpiry();
    const prompt = this.promptBuilder.buildStrategyPrompt(context, dte);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      });

      return {
        strategy:
          response.choices[0]?.message?.content ?? 'No strategy available.',
        creditsRemaining: quota.remaining,
      };
    } catch (err) {
      this.logger.error('OpenAI strategy error', err);
      throw new HttpException(
        'Strategy service unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getDailyBrief(
    index: string,
  ): Promise<{ brief: string; date: string } | null> {
    const today = new Date().toISOString().slice(0, 10);
    const summary = await this.dailySummaryModel
      .findOne({ symbol: index.toUpperCase(), date: today })
      .lean();

    if (!summary || !summary.aiSummary) return null;

    return {
      brief: summary.aiSummary as string,
      date: today,
    };
  }

  async getUsage(
    userId: string,
    plan: string,
  ): Promise<{ used: number; remaining: number; limit: number }> {
    return this.quotaService.getUsage(userId, plan);
  }

  async getAiStatus(
    userId: string,
    plan: string,
  ): Promise<{
    configured: boolean;
    byoKeyEnabled: boolean;
    hasByoKey: boolean;
    planLimits: {
      aiQueriesPerDay: number;
      strategyAI: boolean;
      dailyBrief: boolean;
      byoOpenAIKey: boolean;
    };
  }> {
    const limits = getPlanLimits(plan);
    const configured = this.platformOpenai !== null;

    let hasByoKey = false;
    if (limits.byoOpenAIKey) {
      try {
        const prefs =
          await this.prismaService.client.userPreferences.findUnique({
            where: { userId },
            select: { byoOpenaiKey: true },
          });
        hasByoKey = !!prefs?.byoOpenaiKey;
      } catch {
        // ignore
      }
    }

    return {
      configured,
      byoKeyEnabled: limits.byoOpenAIKey,
      hasByoKey,
      planLimits: {
        aiQueriesPerDay: limits.aiQueriesPerDay,
        strategyAI: limits.strategyAI,
        dailyBrief: limits.dailyBrief,
        byoOpenAIKey: limits.byoOpenAIKey,
      },
    };
  }

  private async getConversationHistory(
    sessionId: string,
    userId: string,
  ): Promise<Array<{ role: string; content: string }>> {
    try {
      const conversation = await this.conversationModel
        .findOne({ sessionId, userId })
        .sort({ createdAt: -1 })
        .lean();

      if (!conversation) return [];

      const messages = (conversation as any).messages as
        | Array<{ role: string; content: string; timestamp: Date }>
        | undefined;
      if (!messages) return [];

      return messages.slice(-3).map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } catch {
      return [];
    }
  }

  private async saveConversation(
    sessionId: string,
    userId: string,
    query: string,
    response: string,
  ): Promise<void> {
    try {
      let conversation = await this.conversationModel
        .findOne({ sessionId, userId })
        .exec();

      const newMessages = [
        { role: 'user', content: query, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() },
      ];

      if (conversation) {
        conversation.messages.push(...newMessages);
        conversation.totalTokens += Math.ceil(
          (query.length + response.length) / 4,
        );
        await conversation.save();
      } else {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.conversationModel.create({
          sessionId,
          userId,
          messages: newMessages,
          totalTokens: Math.ceil((query.length + response.length) / 4),
          createdAt: new Date(),
          expiresAt,
        });
      }
    } catch (err) {
      this.logger.error('Failed to save conversation', err);
    }
  }

  private calculateDaysToExpiry(): number {
    const now = new Date();
    const thisThursday = new Date(now);
    thisThursday.setDate(
      now.getDate() + ((4 - now.getDay() + 7) % 7) + (now.getDay() > 4 ? 7 : 0),
    );
    return Math.ceil(
      (thisThursday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
