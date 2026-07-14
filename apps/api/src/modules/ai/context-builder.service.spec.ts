import { Test, TestingModule } from '@nestjs/testing';
import { ContextBuilderService } from './context-builder.service';
import { RedisService } from '../../redis/redis.service';

describe('ContextBuilderService', () => {
  let service: ContextBuilderService;
  let mockRedisClient: Record<string, jest.Mock>;

  const mockDashboard = {
    index: 'NIFTY',
    spotPrice: 24580,
    priceChangePct: 0.45,
    pcr: 1.23,
    maxPain: 24500,
    totalCallOI: 12500000,
    totalPutOi: 15400000,
    sentiment: 'BULLISH',
    sentimentScore: 72,
    topCallBuildup: [
      { strikePrice: 24700, oiChange: 520000 },
      { strikePrice: 24600, oiChange: 310000 },
    ],
    topPutBuildup: [{ strikePrice: 24400, oiChange: 480000 }],
    unusualActivity: [],
    fetchedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextBuilderService,
        {
          provide: RedisService,
          useValue: { getClient: () => mockRedisClient },
        },
      ],
    }).compile();

    service = module.get<ContextBuilderService>(ContextBuilderService);
  });

  it('returns context when dashboard is cached', async () => {
    (mockRedisClient.get as jest.Mock).mockResolvedValue(
      JSON.stringify(mockDashboard),
    );
    const result = await service.build('NIFTY');
    expect(result).not.toBeNull();
    expect(result!.index).toBe('NIFTY');
    expect(result!.spotPrice).toBe(24580);
    expect(result!.pcr).toBe(1.23);
    expect(result!.sentiment).toBe('BULLISH');
  });

  it('returns null when no cache exists', async () => {
    (mockRedisClient.get as jest.Mock).mockResolvedValue(null);
    const result = await service.build('NIFTY');
    expect(result).toBeNull();
  });

  it('handles partial dashboard data gracefully', async () => {
    (mockRedisClient.get as jest.Mock).mockResolvedValue(
      JSON.stringify({ index: 'NIFTY' }),
    );
    const result = await service.build('NIFTY');
    expect(result).not.toBeNull();
    expect(result!.spotPrice).toBe(0);
    expect(result!.pcr).toBe(1.0);
    expect(result!.sentiment).toBe('NEUTRAL');
  });

  it('returns null on Redis error', async () => {
    (mockRedisClient.get as jest.Mock).mockRejectedValue(
      new Error('Redis error'),
    );
    const result = await service.build('NIFTY');
    expect(result).toBeNull();
  });

  it('truncates topCallBuildup to 3 items', async () => {
    const manyItems = Array.from({ length: 5 }, (_, i) => ({
      strikePrice: 24000 + i * 50,
      oiChange: 100000 * (i + 1),
    }));
    (mockRedisClient.get as jest.Mock).mockResolvedValue(
      JSON.stringify({ ...mockDashboard, topCallBuildup: manyItems }),
    );
    const result = await service.build('NIFTY');
    expect(result!.topCallBuildup.length).toBe(3);
  });
});
