import {
  calculatePCR,
  calculateMaxPain,
  calculateSentiment,
  getATMStrike,
  isMarketOpen,
  getNextMarketOpen,
} from './index.js';
import type { OptionStrike } from '@optionkart/types';

function makeStrike(overrides: Partial<OptionStrike> & { strikePrice: number }): OptionStrike {
  return {
    expiryDate: '2026-07-30',
    callOI: 0,
    callOIChange: 0,
    callLTP: 0,
    callVolume: 0,
    putOI: 0,
    putOIChange: 0,
    putLTP: 0,
    putVolume: 0,
    callIV: 0,
    putIV: 0,
    isATM: false,
    ...overrides,
  };
}

describe('calculatePCR', () => {
  it('returns correct ratio for given OI data', () => {
    const strikes = [
      makeStrike({ strikePrice: 25000, callOI: 100_000, putOI: 150_000 }),
      makeStrike({ strikePrice: 25100, callOI: 200_000, putOI: 250_000 }),
    ];
    expect(calculatePCR(strikes)).toBeCloseTo(1.3333, 3);
  });

  it('returns 0 when call OI is 0', () => {
    const strikes = [makeStrike({ strikePrice: 25000, callOI: 0, putOI: 100_000 })];
    expect(calculatePCR(strikes)).toBe(0);
  });

  it('returns 1 for equal put and call OI', () => {
    const strikes = [makeStrike({ strikePrice: 25000, callOI: 100_000, putOI: 100_000 })];
    expect(calculatePCR(strikes)).toBe(1);
  });

  it('handles empty array', () => {
    expect(calculatePCR([])).toBe(0);
  });
});

describe('calculateMaxPain', () => {
  it('finds strike with minimum pain', () => {
    const strikes = [
      makeStrike({ strikePrice: 25000, callOI: 100_000, putOI: 50_000 }),
      makeStrike({ strikePrice: 25100, callOI: 200_000, putOI: 100_000 }),
      makeStrike({ strikePrice: 25200, callOI: 150_000, putOI: 200_000 }),
    ];
    const result = calculateMaxPain(strikes);
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateMaxPain([])).toBe(0);
  });
});

describe('calculateSentiment', () => {
  it('returns BULLISH for high PCR', () => {
    const result = calculateSentiment(1.5, 0, 0);
    expect(result.label).toBe('BULLISH');
    expect(result.score).toBeGreaterThan(0);
  });

  it('returns BEARISH for low PCR', () => {
    const result = calculateSentiment(0.5, 0, 0);
    expect(result.label).toBe('BEARISH');
    expect(result.score).toBeLessThan(0);
  });

  it('returns NEUTRAL for moderate PCR', () => {
    const result = calculateSentiment(1.0, 0, 0);
    expect(result.label).toBe('NEUTRAL');
  });

  it('factors call OI change into score', () => {
    const fallingCalls = calculateSentiment(1.0, -500_000, 0);
    const risingCalls = calculateSentiment(1.0, 500_000, 0);
    expect(fallingCalls.score).toBeGreaterThan(risingCalls.score);
  });

  it('factors put OI change into score', () => {
    const risingPuts = calculateSentiment(1.0, 0, 500_000);
    const fallingPuts = calculateSentiment(1.0, 0, -500_000);
    expect(risingPuts.score).toBeGreaterThan(fallingPuts.score);
  });
});

describe('getATMStrike', () => {
  const strikes = [
    makeStrike({ strikePrice: 25000 }),
    makeStrike({ strikePrice: 25100 }),
    makeStrike({ strikePrice: 25200 }),
  ];

  it('returns closest strike to spot', () => {
    const atm = getATMStrike(strikes, 25075);
    expect(atm?.strikePrice).toBe(25100);
  });

  it('returns exact match when spot equals strike', () => {
    const atm = getATMStrike(strikes, 25100);
    expect(atm?.strikePrice).toBe(25100);
  });

  it('returns null for empty array', () => {
    expect(getATMStrike([], 25000)).toBeNull();
  });
});

describe('isMarketOpen', () => {
  const weekdayDuringHours = new Date('2026-07-15T04:30:00Z'); // 10:00 AM IST
  const weekdayAfterHours = new Date('2026-07-15T10:30:00Z'); // 4:00 PM IST
  const saturday = new Date('2026-07-18T05:00:00Z'); // 10:30 AM IST Saturday
  const holiday = new Date('2026-08-15T04:30:00Z'); // Independence Day

  it('returns true during market hours on weekdays', () => {
    expect(isMarketOpen(weekdayDuringHours)).toBe(true);
  });

  it('returns false after market hours', () => {
    expect(isMarketOpen(weekdayAfterHours)).toBe(false);
  });

  it('returns false on weekends', () => {
    expect(isMarketOpen(saturday)).toBe(false);
  });

  it('returns false on holidays', () => {
    expect(isMarketOpen(holiday)).toBe(false);
  });
});

describe('getNextMarketOpen', () => {
  it('returns a Date in the future', () => {
    const now = new Date('2026-07-15T10:00:00Z'); // 3:30 PM IST — after close
    const next = getNextMarketOpen(now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it('skips weekends', () => {
    const fridayEvening = new Date('2026-07-17T12:00:00Z'); // Fri 5:30 PM IST
    const next = getNextMarketOpen(fridayEvening);
    const day = new Date(next.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay();
    expect(day).not.toBe(0); // Not Sunday
    expect(day).not.toBe(6); // Not Saturday
  });
});
