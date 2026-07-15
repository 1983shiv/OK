import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MarketService } from './market.service';
import { MarketCacheService } from './market-cache.service';
import { MockDataService } from './mock-data.service';
import { UpstoxService } from './upstox.service';
import { OISnapshot } from '../../mongoose/oi-snapshot.schema';
import type {
  DashboardData,
  OptionStrike,
  MarketStatus,
} from '@optionkart/types';

function buildMockStrike(overrides: Partial<OptionStrike> = {}): OptionStrike {
  return {
    strikePrice: 24000,
    expiryDate: '2026-07-16',
    callOI: 100000,
    callOIChange: 5000,
    callLTP: 120,
    callVolume: 10000,
    putOI: 120000,
    putOIChange: -3000,
    putLTP: 80,
    putVolume: 8000,
    callIV: 14.5,
    putIV: 15.2,
    isATM: false,
    ...overrides,
  };
}

function buildMockDashboard(
  overrides: Partial<DashboardData> = {},
): DashboardData {
  return {
    index: 'NIFTY',
    spotPrice: 24100,
    pcr: 1.05,
    pcrTrend: 'NEUTRAL',
    maxPain: 24100,
    sentiment: 'NEUTRAL',
    sentimentScore: 50,
    totalCallOI: 5000000,
    totalPutOI: 5200000,
    callOIChange: 100000,
    putOIChange: 80000,
    topCallBuildup: [buildMockStrike()],
    topPutBuildup: [buildMockStrike()],
    marketStatus: 'OPEN' as MarketStatus,
    nextOpenAt: null,
    isStale: false,
    staleAgeSeconds: 0,
    fetchedAt: new Date().toISOString(),
    vix: 14.5,
    mfi: 55,
    mfiSignal: 'NEUTRAL' as const,
    ...overrides,
  };
}

describe('MarketService', () => {
  let service: MarketService;
  let cacheService: Record<string, jest.Mock>;
  let mockDataService: Record<string, jest.Mock>;
  let upstoxService: Record<string, jest.Mock>;
  let oiModel: Record<string, jest.Mock>;

  const mockChain = [
    buildMockStrike({ strikePrice: 24000, callOIChange: 60000 }),
    buildMockStrike({ strikePrice: 24100, callOIChange: -10000 }),
    buildMockStrike({ strikePrice: 24200, callOIChange: 70000 }),
  ];

  const mockDashboard = buildMockDashboard({ topCallBuildup: mockChain });

  const mockData = {
    dashboard: mockDashboard,
    chain: mockChain,
    spotPrice: 24100,
  };

  beforeEach(async () => {
    cacheService = {
      getDashboard: jest.fn(),
      getChain: jest.fn(),
      getSpot: jest.fn(),
      setDashboard: jest.fn().mockResolvedValue(undefined),
      setChain: jest.fn().mockResolvedValue(undefined),
      setSpot: jest.fn().mockResolvedValue(undefined),
    };

    const mockPcrHistory = [
      { pcr: 1.05, timestamp: '2026-07-13T06:00:00Z' },
      { pcr: 1.03, timestamp: '2026-07-13T05:55:00Z' },
    ];
    const mockOiHistory = [
      {
        timestamp: '2026-07-13T06:00:00Z',
        totalCallOI: 8000000,
        totalPutOI: 8300000,
      },
    ];

    mockDataService = {
      generate: jest.fn().mockReturnValue(mockData),
      getCached: jest.fn().mockReturnValue(null),
      setCached: jest.fn(),
      generateMockPcrHistory: jest.fn().mockReturnValue(mockPcrHistory),
      generateMockOiHistory: jest.fn().mockReturnValue(mockOiHistory),
    };

    upstoxService = {
      isConfigured: jest.fn().mockReturnValue(false),
      fetchSpotPrice: jest.fn().mockResolvedValue(null),
    };

    oiModel = {
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: MarketCacheService, useValue: cacheService },
        { provide: MockDataService, useValue: mockDataService },
        { provide: UpstoxService, useValue: upstoxService },
        { provide: getModelToken(OISnapshot.name), useValue: oiModel },
      ],
    }).compile();

    service = module.get<MarketService>(MarketService);
  });

  describe('getDashboard', () => {
    it('returns cached dashboard when available', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(
        JSON.stringify(mockDashboard),
      );
      const result = await service.getDashboard('NIFTY');
      expect(result.spotPrice).toBe(24100);
      expect(mockDataService.generate).not.toHaveBeenCalled();
    });

    it('falls back to mock data service cache', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(null);
      (mockDataService.getCached as jest.Mock).mockReturnValue(mockData);
      const result = await service.getDashboard('NIFTY');
      expect(result.spotPrice).toBe(24100);
    });

    it('generates fresh data when nothing cached', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(null);
      const result = await service.getDashboard('BANKNIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('BANKNIFTY');
      expect(mockDataService.setCached).toHaveBeenCalled();
      expect(result.spotPrice).toBe(24100);
    });
  });

  describe('getChain', () => {
    it('returns chain from cache', async () => {
      (cacheService.getChain as jest.Mock).mockResolvedValue(
        JSON.stringify(mockChain),
      );
      const result = await service.getChain('NIFTY');
      expect(result.chain).toHaveLength(3);
      expect(result.chain[0]!.strikePrice).toBe(24000);
    });

    it('falls back to mock data service', async () => {
      (cacheService.getChain as jest.Mock).mockResolvedValue(null);
      (mockDataService.getCached as jest.Mock).mockReturnValue(mockData);
      const result = await service.getChain('NIFTY');
      expect(result.chain).toHaveLength(3);
    });

    it('generates fresh chain when empty', async () => {
      (cacheService.getChain as jest.Mock).mockResolvedValue(null);
      const result = await service.getChain('MIDCPNIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('MIDCPNIFTY');
      expect(result.chain).toHaveLength(3);
    });
  });

  describe('getSpot', () => {
    it('returns spot from cache', async () => {
      (cacheService.getSpot as jest.Mock).mockResolvedValue(
        JSON.stringify({ price: 24200, fetchedAt: '2026-07-13T00:00:00Z' }),
      );
      const result = await service.getSpot('NIFTY');
      expect(result.price).toBe(24200);
    });

    it('falls back to mock data', async () => {
      (cacheService.getSpot as jest.Mock).mockResolvedValue(null);
      const result = await service.getSpot('NIFTY');
      expect(result.price).toBe(24100);
    });
  });

  describe('getPCR', () => {
    it('returns PCR from dashboard', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(
        JSON.stringify(mockDashboard),
      );
      const result = await service.getPCR('NIFTY');
      expect(result.pcr).toBe(1.05);
      expect(result.pcrTrend).toBe('NEUTRAL');
    });
  });

  describe('getMaxPain', () => {
    it('returns max pain from dashboard', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(
        JSON.stringify(mockDashboard),
      );
      const result = await service.getMaxPain('NIFTY');
      expect(result.maxPain).toBe(24100);
      expect(result.spotPrice).toBe(24100);
    });
  });

  describe('getSupportResistance', () => {
    const varyingChain = [
      buildMockStrike({ strikePrice: 24000, callOI: 100000, putOI: 500000 }),
      buildMockStrike({ strikePrice: 24100, callOI: 500000, putOI: 100000 }),
      buildMockStrike({ strikePrice: 24200, callOI: 800000, putOI: 20000 }),
    ];

    const varyingDash = buildMockDashboard({ spotPrice: 24100 });

    it('finds support (max put OI below spot) and resistance (max call OI above spot)', async () => {
      (cacheService.getDashboard as jest.Mock).mockResolvedValue(
        JSON.stringify(varyingDash),
      );
      (cacheService.getChain as jest.Mock).mockResolvedValue(
        JSON.stringify(varyingChain),
      );
      const result = await service.getSupportResistance('NIFTY');

      expect(result.support).toBe(24000);
      expect(result.resistance).toBe(24200);
      expect(result.spotPrice).toBe(24100);
    });
  });

  describe('getPCRHistory', () => {
    it('returns history from MongoDB snapshots', async () => {
      const snapshots = [
        { pcr: 1.1, fetchedAt: new Date('2026-07-13T06:00:00Z') },
        { pcr: 1.05, fetchedAt: new Date('2026-07-13T05:55:00Z') },
      ];
      (oiModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(snapshots),
      });

      const result = await service.getPCRHistory('NIFTY');
      expect(result).toHaveLength(2);
      expect(result[0]!.pcr).toBe(1.1);
      expect(result[0]!.timestamp).toBe('2026-07-13T06:00:00.000Z');
    });

    it('falls back to mock history when no snapshots', async () => {
      const result = await service.getPCRHistory('NIFTY');
      expect(result).toHaveLength(2);
      expect(result[0]!.pcr).toBe(1.05);
      expect(mockDataService.generateMockPcrHistory).toHaveBeenCalledWith(
        'NIFTY',
      );
    });
  });

  describe('getHeatmap', () => {
    it('returns OI data for all strikes', async () => {
      (cacheService.getChain as jest.Mock).mockResolvedValue(
        JSON.stringify(mockChain),
      );
      const result = await service.getHeatmap('NIFTY');
      expect(result).toHaveLength(3);
      expect(result[0]!).toHaveProperty('strikePrice');
      expect(result[0]!).toHaveProperty('callOI');
      expect(result[0]!).toHaveProperty('putOI');
      expect(result[0]!).toHaveProperty('oiChange');
    });
  });

  describe('getOIHistory', () => {
    it('falls back to mock OI history when no snapshots', async () => {
      const result = await service.getOIHistory('NIFTY');
      expect(result).toHaveLength(1);
      expect(result[0]!.totalCallOI).toBe(8000000);
      expect(mockDataService.generateMockOiHistory).toHaveBeenCalledWith(
        'NIFTY',
      );
    });

    it('returns OI history from snapshots', async () => {
      const snapshots = [
        {
          strikes: [
            { callOI: 5000000, putOI: 5200000 },
            { callOI: 3000000, putOI: 3100000 },
          ],
          fetchedAt: new Date('2026-07-13T06:00:00Z'),
        },
      ];
      (oiModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(snapshots),
      });

      const result = await service.getOIHistory('NIFTY');
      expect(result).toHaveLength(1);
      expect(result[0]!.totalCallOI).toBe(8000000);
      expect(result[0]!.totalPutOI).toBe(8300000);
    });
  });

  describe('getUnusualActivity', () => {
    it('filters strikes with OI change > 50000', async () => {
      (cacheService.getChain as jest.Mock).mockResolvedValue(
        JSON.stringify(mockChain),
      );
      const result = await service.getUnusualActivity('NIFTY');
      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach((item) => {
        expect(
          Math.abs(item.callOIChange) > 50000 ||
            Math.abs(item.putOIChange) > 50000,
        ).toBe(true);
      });
    });

    it('limits to 20 results', async () => {
      const manyStrikes = Array.from({ length: 30 }, (_, i) =>
        buildMockStrike({ strikePrice: 24000 + i * 50, callOIChange: 60000 }),
      );
      (cacheService.getChain as jest.Mock).mockResolvedValue(
        JSON.stringify(manyStrikes),
      );
      const result = await service.getUnusualActivity('NIFTY');
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('fetchAndCache', () => {
    it('uses mock data when Upstox not configured', async () => {
      await service.fetchAndCache('NIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('NIFTY');
      expect(cacheService.setDashboard).toHaveBeenCalled();
      expect(cacheService.setChain).toHaveBeenCalled();
      expect(cacheService.setSpot).toHaveBeenCalled();
    });

    it('uses Upstox when configured', async () => {
      (upstoxService.isConfigured as jest.Mock).mockReturnValue(true);
      (upstoxService.fetchSpotPrice as jest.Mock).mockResolvedValue(24200);
      await service.fetchAndCache('NIFTY');
      expect(mockDataService.generate).toHaveBeenCalled();
    });
  });

  describe('scheduledPoll', () => {
    it('fetches all supported indices during market hours', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-13T10:00:00+05:30').getTime());

      await service.scheduledPoll();

      expect(mockDataService.generate).toHaveBeenCalledTimes(4);
      expect(mockDataService.generate).toHaveBeenCalledWith('NIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('BANKNIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('FINNIFTY');
      expect(mockDataService.generate).toHaveBeenCalledWith('MIDCPNIFTY');

      jest.useRealTimers();
    });
  });
});
