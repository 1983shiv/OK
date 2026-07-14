jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import { HttpException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService', () => {
  let configService: { get: jest.Mock };
  let quotaService: { checkAndDeduct: jest.Mock; getUsage: jest.Mock };
  let contextBuilder: { build: jest.Mock };
  let promptBuilder: {
    buildChatPrompt: jest.Mock;
    buildStrategyPrompt: jest.Mock;
    buildDailyBriefPrompt: jest.Mock;
  };
  let redisService: { getClient: jest.Mock };
  let prismaService: {
    client: { userPreferences: { findUnique: jest.Mock } };
  };
  let encryptionService: { decrypt: jest.Mock; encrypt: jest.Mock };
  let conversationModel: { findOne: jest.Mock; create: jest.Mock };
  let dailySummaryModel: { findOne: jest.Mock; updateOne: jest.Mock };
  let redisClient: { get: jest.Mock; setex: jest.Mock };

  function createService(apiKey?: string): AiService {
    configService.get = jest.fn().mockReturnValue(apiKey);
    return new AiService(
      configService as any,
      quotaService as any,
      contextBuilder as any,
      promptBuilder as any,
      redisService as any,
      prismaService as any,
      encryptionService as any,
      conversationModel as any,
      dailySummaryModel as any,
    );
  }

  const mockCallback = {
    onToken: jest.fn(),
    onDone: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue(undefined) };
    quotaService = { checkAndDeduct: jest.fn(), getUsage: jest.fn() };
    contextBuilder = { build: jest.fn() };
    promptBuilder = {
      buildChatPrompt: jest.fn(),
      buildStrategyPrompt: jest.fn(),
      buildDailyBriefPrompt: jest.fn(),
    };
    redisClient = { get: jest.fn(), setex: jest.fn() };
    redisService = { getClient: jest.fn().mockReturnValue(redisClient) };
    prismaService = {
      client: {
        userPreferences: { findUnique: jest.fn() },
      },
    };
    encryptionService = { decrypt: jest.fn(), encrypt: jest.fn() };
    conversationModel = { findOne: jest.fn(), create: jest.fn() };
    dailySummaryModel = { findOne: jest.fn(), updateOne: jest.fn() };
    jest.clearAllMocks();
  });

  describe('isConfigured', () => {
    it('returns true when OPENAI_API_KEY is set', () => {
      const svc = createService('sk-test-key');
      expect(svc.isConfigured()).toBe(true);
    });

    it('returns false when OPENAI_API_KEY is not set', () => {
      const svc = createService();
      expect(svc.isConfigured()).toBe(false);
    });
  });

  describe('streamChat', () => {
    it('rejects when quota exceeded', async () => {
      (quotaService.checkAndDeduct as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
      });

      const svc = createService();
      await svc.streamChat(
        'user-1',
        'FREE',
        'test query',
        'NIFTY',
        undefined,
        mockCallback,
      );

      expect(mockCallback.onError).toHaveBeenCalled();
      expect(mockCallback.onToken).not.toHaveBeenCalled();
    });

    it('calls onError with HttpException on quota exceeded', async () => {
      (quotaService.checkAndDeduct as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
      });

      const svc = createService();
      await svc.streamChat(
        'user-1',
        'FREE',
        'test',
        'NIFTY',
        undefined,
        mockCallback,
      );

      expect(mockCallback.onError).toHaveBeenCalledWith(
        expect.any(HttpException),
      );
    });

    it('returns message when OpenAI not configured and no BYO key', async () => {
      (quotaService.checkAndDeduct as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 4,
        limit: 5,
      });
      (
        prismaService.client.userPreferences.findUnique as jest.Mock
      ).mockResolvedValue(null);

      const svc = createService();
      await svc.streamChat(
        'user-1',
        'FREE',
        'test query',
        'NIFTY',
        undefined,
        mockCallback,
      );

      expect(mockCallback.onToken).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
      expect(mockCallback.onDone).toHaveBeenCalledWith(0, 4);
    });
  });

  describe('suggestStrategy', () => {
    it('rejects when quota exceeded', async () => {
      (quotaService.checkAndDeduct as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
      });

      const svc = createService();
      await expect(
        svc.suggestStrategy('user-1', 'FREE', 'NIFTY'),
      ).rejects.toThrow();
    });

    it('returns message when not configured and no BYO key', async () => {
      (quotaService.checkAndDeduct as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 4,
        limit: 5,
      });
      (
        prismaService.client.userPreferences.findUnique as jest.Mock
      ).mockResolvedValue(null);

      const svc = createService();
      const result = await svc.suggestStrategy('user-1', 'FREE', 'NIFTY');
      expect(result.strategy).toContain('not configured');
      expect(result.creditsRemaining).toBe(4);
    });
  });

  describe('getDailyBrief', () => {
    it('returns brief when available', async () => {
      dailySummaryModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          symbol: 'NIFTY',
          date: '2026-07-14',
          aiSummary: 'NIFTY ended the day flat',
        }),
      });

      const svc = createService();
      const result = await svc.getDailyBrief('NIFTY');
      expect(result).not.toBeNull();
      expect(result!.brief).toBe('NIFTY ended the day flat');
    });

    it('returns null when no brief exists', async () => {
      dailySummaryModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const svc = createService();
      const result = await svc.getDailyBrief('NIFTY');
      expect(result).toBeNull();
    });

    it('returns null when brief has no aiSummary', async () => {
      dailySummaryModel.findOne = jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue({ symbol: 'NIFTY', date: '2026-07-14' }),
      });

      const svc = createService();
      const result = await svc.getDailyBrief('NIFTY');
      expect(result).toBeNull();
    });
  });

  describe('getUsage', () => {
    it('delegates to quotaService', async () => {
      (quotaService.getUsage as jest.Mock).mockResolvedValue({
        used: 2,
        remaining: 3,
        limit: 5,
      });

      const svc = createService();
      const result = await svc.getUsage('user-1', 'FREE');
      expect(result).toEqual({ used: 2, remaining: 3, limit: 5 });
    });
  });

  describe('getAiStatus', () => {
    it('returns status for free user', async () => {
      const svc = createService();
      const result = await svc.getAiStatus('user-1', 'FREE');
      expect(result.configured).toBe(false);
      expect(result.byoKeyEnabled).toBe(false);
      expect(result.hasByoKey).toBe(false);
      expect(result.planLimits.aiQueriesPerDay).toBe(5);
    });

    it('returns status for elite user with BYO key', async () => {
      (
        prismaService.client.userPreferences.findUnique as jest.Mock
      ).mockResolvedValue({
        byoOpenaiKey: 'encrypted-key-value',
      });
      const svc = createService();
      const result = await svc.getAiStatus('user-elite', 'ELITE');
      expect(result.byoKeyEnabled).toBe(true);
      expect(result.hasByoKey).toBe(true);
      expect(result.planLimits.byoOpenAIKey).toBe(true);
    });

    it('returns status for elite user without BYO key', async () => {
      (
        prismaService.client.userPreferences.findUnique as jest.Mock
      ).mockResolvedValue({
        byoOpenaiKey: null,
      });
      const svc = createService();
      const result = await svc.getAiStatus('user-elite', 'ELITE');
      expect(result.byoKeyEnabled).toBe(true);
      expect(result.hasByoKey).toBe(false);
    });
  });
});
