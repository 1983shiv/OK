import { Test, TestingModule } from '@nestjs/testing';
import { QuotaService } from './quota.service';
import { RedisService } from '../../redis/redis.service';

describe('QuotaService', () => {
  let service: QuotaService;
  let mockRedisClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRedisClient = {
      incr: jest.fn(),
      expireat: jest.fn(),
      decr: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        {
          provide: RedisService,
          useValue: { getClient: () => mockRedisClient },
        },
      ],
    }).compile();

    service = module.get<QuotaService>(QuotaService);
  });

  it('allows query when under limit', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(1);
    const result = await service.checkAndDeduct('user-1', 'FREE');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it('blocks query when over limit', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(6);
    (mockRedisClient.decr as jest.Mock).mockResolvedValue(5);
    const result = await service.checkAndDeduct('user-1', 'FREE');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(mockRedisClient.decr).toHaveBeenCalled();
  });

  it('allows query at exactly the limit', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(5);
    const result = await service.checkAndDeduct('user-1', 'FREE');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('uses plan-specific limits (PRO = 100)', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(1);
    const result = await service.checkAndDeduct('user-pro', 'PRO');
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
  });

  it('uses plan-specific limits (ELITE = 300)', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(50);
    const result = await service.checkAndDeduct('user-elite', 'ELITE');
    expect(result.limit).toBe(300);
    expect(result.remaining).toBe(250);
  });

  it('expires key on first increment', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(1);
    (mockRedisClient.expireat as jest.Mock).mockResolvedValue(1);
    await service.checkAndDeduct('user-1', 'FREE');
    expect(mockRedisClient.expireat).toHaveBeenCalled();
  });

  it('does not expire key on subsequent increments', async () => {
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(3);
    await service.checkAndDeduct('user-1', 'FREE');
    expect(mockRedisClient.expireat).not.toHaveBeenCalled();
  });

  it('returns usage info', async () => {
    (mockRedisClient.get as jest.Mock).mockResolvedValue('3');
    const result = await service.getUsage('user-1', 'FREE');
    expect(result.used).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('returns zero usage when no key exists', async () => {
    (mockRedisClient.get as jest.Mock).mockResolvedValue(null);
    const result = await service.getUsage('user-1', 'FREE');
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(5);
  });

  it('falls back to allowed=true on Redis error', async () => {
    (mockRedisClient.incr as jest.Mock).mockRejectedValue(
      new Error('Redis down'),
    );
    const result = await service.checkAndDeduct('user-1', 'FREE');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
  });

  it('falls back to zero usage on Redis error for getUsage', async () => {
    (mockRedisClient.get as jest.Mock).mockRejectedValue(
      new Error('Redis down'),
    );
    const result = await service.getUsage('user-1', 'FREE');
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(5);
  });
});
