import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UpstoxService } from './upstox.service';

describe('UpstoxService', () => {
  let service: UpstoxService;
  let configService: Record<string, jest.Mock>;

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpstoxService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<UpstoxService>(UpstoxService);
  });

  describe('isConfigured', () => {
    it('returns true when both UPSTOX_CLIENT_ID and UPSTOX_CLIENT_SECRET are set', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('client-id')
        .mockReturnValueOnce('client-secret');
      expect(service.isConfigured()).toBe(true);
    });

    it('returns false when credentials are missing', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('returns null when not configured', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);
      const result = await (service as any).authenticate();
      expect(result).toBeNull();
    });

    it('returns null when circuit breaker is open', async () => {
      const serviceAny = service as any;
      serviceAny.consecutiveFailures = 3;
      serviceAny.circuitOpenUntil = Date.now() + 60_000;
      (configService.get as jest.Mock)
        .mockReturnValueOnce('client-id')
        .mockReturnValueOnce('client-secret');
      const result = await serviceAny.authenticate();
      expect(result).toBeNull();
    });
  });

  describe('circuit breaker', () => {
    it('opens after 3 consecutive failures', () => {
      const serviceAny = service as any;
      serviceAny.recordFailure();
      expect(serviceAny.consecutiveFailures).toBe(1);
      serviceAny.recordFailure();
      expect(serviceAny.consecutiveFailures).toBe(2);
      serviceAny.recordFailure();
      expect(serviceAny.consecutiveFailures).toBe(3);
      expect(serviceAny.circuitOpenUntil).not.toBeNull();
    });

    it('resets circuit breaker after timeout', () => {
      const serviceAny = service as any;
      serviceAny.circuitOpenUntil = Date.now() + 60_000;
      const isOpenBefore = serviceAny.isCircuitBroken();
      expect(isOpenBefore).toBe(true);

      serviceAny.circuitOpenUntil = Date.now() - 1_000;
      const isOpenAfter = serviceAny.isCircuitBroken();
      expect(isOpenAfter).toBe(false);
      expect(serviceAny.consecutiveFailures).toBe(0);
      expect(serviceAny.circuitOpenUntil).toBeNull();
    });

    it('recordSuccess resets failures and opens circuit', () => {
      const serviceAny = service as any;
      serviceAny.consecutiveFailures = 3;
      serviceAny.circuitOpenUntil = Date.now() + 60_000;
      serviceAny.recordSuccess();
      expect(serviceAny.consecutiveFailures).toBe(0);
      expect(serviceAny.circuitOpenUntil).toBeNull();
    });
  });

  describe('fetchSpotPrice', () => {
    it('returns null when not configured', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);
      const result = await service.fetchSpotPrice('NSE_INDEX|Nifty 50');
      expect(result).toBeNull();
    });

    it('returns null when circuit breaker is open', async () => {
      const serviceAny = service as any;
      serviceAny.consecutiveFailures = 3;
      serviceAny.circuitOpenUntil = Date.now() + 60_000;
      (configService.get as jest.Mock)
        .mockReturnValueOnce('client-id')
        .mockReturnValueOnce('client-secret');
      const result = await service.fetchSpotPrice('NSE_INDEX|Nifty 50');
      expect(result).toBeNull();
    });
  });
});
