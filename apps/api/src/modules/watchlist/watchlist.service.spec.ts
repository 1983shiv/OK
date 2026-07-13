import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let prismaWatchlist: Record<string, jest.Mock>;
  let prismaUser: Record<string, jest.Mock>;

  const mockUser = { id: 'user-1', plan: 'FREE' };
  const mockItem = {
    id: 'wl-1',
    userId: 'user-1',
    instrumentKey: 'NIFTY_24200_CE',
    symbol: 'NIFTY',
    strikePrice: 24200,
    optionType: 'CE',
    expiryDate: new Date('2026-07-16'),
    createdAt: new Date('2026-07-13'),
  };

  beforeEach(async () => {
    prismaWatchlist = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    prismaUser = {
      findUnique: jest.fn(),
    };

    const mockPrisma = {
      client: { watchlistItem: prismaWatchlist, user: prismaUser },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
  });

  describe('list', () => {
    it('returns watchlist items for user', async () => {
      (prismaWatchlist.findMany as jest.Mock).mockResolvedValue([mockItem]);
      const result = await service.list('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.symbol).toBe('NIFTY');
    });

    it('returns empty array when no items', async () => {
      (prismaWatchlist.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.list('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    const addData = {
      instrumentKey: 'NIFTY_24200_CE',
      symbol: 'NIFTY',
      strikePrice: 24200,
      optionType: 'CE' as const,
      expiryDate: '2026-07-16',
    };

    it('adds item within plan limits', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaWatchlist.count as jest.Mock).mockResolvedValue(3);
      (prismaWatchlist.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.add('user-1', addData);
      expect(result.symbol).toBe('NIFTY');
    });

    it('throws when at plan limit', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaWatchlist.count as jest.Mock).mockResolvedValue(5);

      await expect(service.add('user-1', addData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when user not found', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.add('user-1', addData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('uses PRO plan limits for pro users', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-2',
        plan: 'PRO',
      });
      (prismaWatchlist.count as jest.Mock).mockResolvedValue(25);
      (prismaWatchlist.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.add('user-2', addData);
      expect(result.symbol).toBe('NIFTY');
    });
  });

  describe('remove', () => {
    it('removes existing item', async () => {
      (prismaWatchlist.findFirst as jest.Mock).mockResolvedValue(mockItem);
      (prismaWatchlist.delete as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.remove('user-1', 'wl-1');
      expect(result.success).toBe(true);
    });

    it('throws for non-existent item', async () => {
      (prismaWatchlist.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('user-1', 'bad-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
