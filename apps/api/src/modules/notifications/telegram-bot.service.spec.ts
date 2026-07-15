import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

describe('TelegramBotService', () => {
  let service: TelegramBotService;
  let configService: Record<string, jest.Mock>;
  let prisma: Record<string, any>;
  let marketService: Record<string, jest.Mock>;

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    };

    prisma = {
      client: {
        userPreferences: {
          findFirst: jest.fn(),
          updateMany: jest.fn(),
        },
        watchlistItem: {
          findMany: jest.fn(),
        },
      },
    };

    marketService = {
      getDashboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
        { provide: MarketService, useValue: marketService },
      ],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
  });

  describe('isConfigured', () => {
    it('returns false when token not set', () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);
      expect(service.isConfigured).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('does not throw when bot not configured', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);
      await expect(
        (service as any).sendMessage('123', 'test'),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendAlert', () => {
    it('does nothing when user preferences not found', async () => {
      (prisma.client.userPreferences.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(
        service.sendAlert('user-1', 'Test Alert', 'Test message'),
      ).resolves.toBeUndefined();
    });

    it('does nothing when user has no telegramChatId', async () => {
      (prisma.client.userPreferences.findFirst as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        telegramChatId: null,
      });
      await expect(
        service.sendAlert('user-1', 'Test Alert', 'Test message'),
      ).resolves.toBeUndefined();
    });
  });
});
