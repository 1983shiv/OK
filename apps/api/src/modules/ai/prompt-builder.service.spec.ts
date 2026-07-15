import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  describe('buildChatPrompt', () => {
    it('includes market context when provided', () => {
      const context = {
        index: 'NIFTY',
        timestamp: '2026-07-14T09:30:00Z',
        spotPrice: 24580,
        priceChangePct: 0.45,
        pcr: 1.23,
        maxPain: 24500,
        totalCallOi: 12500000,
        totalPutOi: 15400000,
        sentiment: 'BULLISH',
        sentimentScore: 72,
        topCallBuildup: [{ strike: 24700, oiChange: 520000 }],
        topPutBuildup: [{ strike: 24400, oiChange: 480000 }],
        unusualActivity: [],
      };
      const result = service.buildChatPrompt(
        context,
        'What is Nifty sentiment?',
        [],
      );
      expect(result).toContain('OptionKart AI');
      expect(result).toContain('NIFTY');
      expect(result).toContain('24580');
      expect(result).toContain('1.23');
      expect(result).toContain('BULLISH');
    });

    it('handles null context gracefully', () => {
      const result = service.buildChatPrompt(null, 'How is the market?', []);
      expect(result).toContain('No live market data available');
    });

    it('includes conversation history', () => {
      const history = [
        { role: 'user', content: 'What is PCR?' },
        { role: 'assistant', content: 'PCR is 1.23' },
      ];
      const result = service.buildChatPrompt(null, 'Tell me more', history);
      expect(result).toContain('What is PCR?');
      expect(result).toContain('PCR is 1.23');
    });

    it('includes the user query', () => {
      const result = service.buildChatPrompt(null, 'My test query', []);
      expect(result).toContain('My test query');
    });

    it('limits history to last 3 messages', () => {
      const manyMessages = Array.from({ length: 6 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
      }));
      const result = service.buildChatPrompt(null, 'Final query', manyMessages);
      expect(result).toContain('Message 4');
      expect(result).toContain('Message 5');
      expect(result).toContain('Message 6');
      expect(result).not.toContain('Message 1');
    });

    it('enforces no financial advice rule', () => {
      const result = service.buildChatPrompt(null, 'test', []);
      expect(result).toContain('NEVER recommend buying or selling');
    });
  });

  describe('buildStrategyPrompt', () => {
    it('includes context and DTE', () => {
      const context = {
        index: 'NIFTY',
        timestamp: '2026-07-14T09:30:00Z',
        spotPrice: 24580,
        priceChangePct: 0.0,
        pcr: 1.1,
        maxPain: 24500,
        totalCallOi: 10000000,
        totalPutOi: 11000000,
        sentiment: 'NEUTRAL',
        sentimentScore: 55,
        topCallBuildup: [],
        topPutBuildup: [],
        unusualActivity: [],
      };
      const result = service.buildStrategyPrompt(context, 3);
      expect(result).toContain('Days to Expiry: 3');
      expect(result).toContain('options strategy educator');
    });

    it('handles null context', () => {
      const result = service.buildStrategyPrompt(null, 5);
      expect(result).toContain('No live market data available');
    });
  });

  describe('buildDailyBriefPrompt', () => {
    it('includes index and summary data', () => {
      const summaryData = { openPcr: 1.1, closePcr: 1.23 };
      const result = service.buildDailyBriefPrompt('NIFTY', summaryData);
      expect(result).toContain('NIFTY Daily Brief');
      expect(result).toContain('openPcr');
      expect(result).toContain('closePcr');
    });
  });
});
