import { Test, TestingModule } from '@nestjs/testing';
import { MarketCacheService } from './market-cache.service';
import { RedisService } from '../../redis/redis.service';

describe('MarketCacheService', () => {
  let service: MarketCacheService;
  let redisClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      setex: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(redisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketCacheService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<MarketCacheService>(MarketCacheService);
  });

  describe('chain', () => {
    it('getChain calls redis.get with correct key', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('chain-data');
      const result = await service.getChain('NIFTY');
      expect(redisClient.get).toHaveBeenCalledWith('ok:live:chain:NIFTY');
      expect(result).toBe('chain-data');
    });

    it('setChain calls redis.setex with correct key and TTL', async () => {
      await service.setChain('NIFTY', 'data');
      expect(redisClient.setex).toHaveBeenCalledWith(
        'ok:live:chain:NIFTY',
        90,
        'data',
      );
    });

    it('getChain returns null on cache miss', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const result = await service.getChain('MISSING');
      expect(result).toBeNull();
    });
  });

  describe('dashboard', () => {
    it('getDashboard calls redis.get with correct key', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('dash-data');
      const result = await service.getDashboard('BANKNIFTY');
      expect(redisClient.get).toHaveBeenCalledWith(
        'ok:live:dashboard:BANKNIFTY',
      );
      expect(result).toBe('dash-data');
    });

    it('setDashboard calls redis.setex with correct TTL', async () => {
      await service.setDashboard('FINNIFTY', 'data');
      expect(redisClient.setex).toHaveBeenCalledWith(
        'ok:live:dashboard:FINNIFTY',
        90,
        'data',
      );
    });
  });

  describe('spot', () => {
    it('getSpot calls redis.get with correct key', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('spot-data');
      const result = await service.getSpot('MIDCPNIFTY');
      expect(redisClient.get).toHaveBeenCalledWith('ok:live:spot:MIDCPNIFTY');
      expect(result).toBe('spot-data');
    });

    it('setSpot calls redis.setex with 30s TTL', async () => {
      await service.setSpot('MIDCPNIFTY', 'data');
      expect(redisClient.setex).toHaveBeenCalledWith(
        'ok:live:spot:MIDCPNIFTY',
        30,
        'data',
      );
    });
  });
});
