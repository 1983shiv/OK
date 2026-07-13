import { Test, TestingModule } from '@nestjs/testing';
import { MockDataService } from './mock-data.service';

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockDataService],
    }).compile();

    service = module.get<MockDataService>(MockDataService);
  });

  describe('generate', () => {
    it.each(INDICES)('generates valid data for %s', (index) => {
      const result = service.generate(index);

      expect(result).toHaveProperty('dashboard');
      expect(result).toHaveProperty('chain');
      expect(result).toHaveProperty('spotPrice');

      expect(result.dashboard.index).toBe(index);
      expect(result.dashboard.spotPrice).toBeGreaterThan(0);
      expect(result.dashboard.pcr).toBeGreaterThan(0);
      expect(result.dashboard.maxPain).toBeGreaterThan(0);
      expect(typeof result.dashboard.sentimentScore).toBe('number');
      expect(result.dashboard.totalCallOI).toBeGreaterThan(0);
      expect(result.dashboard.totalPutOI).toBeGreaterThan(0);
      expect(result.dashboard.topCallBuildup).toHaveLength(5);
      expect(result.dashboard.topPutBuildup).toHaveLength(5);
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(
        result.dashboard.sentiment,
      );
      expect(['OPEN', 'CLOSED']).toContain(result.dashboard.marketStatus);

      expect(result.chain.length).toBeGreaterThan(10);
      result.chain.forEach((strike) => {
        expect(strike.strikePrice).toBeGreaterThan(0);
        expect(strike.callOI).toBeGreaterThan(0);
        expect(strike.putOI).toBeGreaterThan(0);
        expect(strike.callIV).toBeGreaterThan(0);
        expect(strike.putIV).toBeGreaterThan(0);
        expect(strike.expiryDate).toBeTruthy();
      });
    });

    it('generates spot price within expected range', () => {
      const nifty = service.generate('NIFTY');
      expect(nifty.spotPrice).toBeGreaterThan(24000);
      expect(nifty.spotPrice).toBeLessThan(24400);

      const bankNifty = service.generate('BANKNIFTY');
      expect(bankNifty.spotPrice).toBeGreaterThan(50800);
      expect(bankNifty.spotPrice).toBeLessThan(51200);
    });

    it('defaults to NIFTY config for unknown index', () => {
      const result = service.generate('SENSEX');
      expect(result.chain.length).toBeGreaterThan(10);
      expect(result.dashboard.index).toBe('SENSEX');
    });

    it('returns consistent PCR between 0 and 2', () => {
      for (const index of INDICES) {
        const result = service.generate(index);
        expect(result.dashboard.pcr).toBeGreaterThan(0);
        expect(result.dashboard.pcr).toBeLessThan(2);
      }
    });

    it('topCallBuildup items are sorted descending by callOIChange', () => {
      const result = service.generate('NIFTY');
      for (let i = 1; i < result.dashboard.topCallBuildup.length; i++) {
        expect(
          result.dashboard.topCallBuildup[i]!.callOIChange,
        ).toBeLessThanOrEqual(
          result.dashboard.topCallBuildup[i - 1]!.callOIChange,
        );
      }
    });

    it('topPutBuildup items are sorted descending by putOIChange', () => {
      const result = service.generate('NIFTY');
      for (let i = 1; i < result.dashboard.topPutBuildup.length; i++) {
        expect(
          result.dashboard.topPutBuildup[i]!.putOIChange,
        ).toBeLessThanOrEqual(
          result.dashboard.topPutBuildup[i - 1]!.putOIChange,
        );
      }
    });
  });

  describe('cache', () => {
    it('stores and retrieves cached data', () => {
      const data = service.generate('NIFTY');
      service.setCached('NIFTY', data);

      const cached = service.getCached('NIFTY');
      expect(cached).toBeDefined();
      expect(cached!.dashboard.spotPrice).toBe(data.spotPrice);
      expect(cached!.fetchedAt).toBeInstanceOf(Date);
    });

    it('returns undefined for uncached index', () => {
      expect(service.getCached('NONEXISTENT')).toBeUndefined();
    });
  });
});
