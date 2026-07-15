import { Injectable } from '@nestjs/common';
import type {
  OptionStrike,
  DashboardData,
  MarketStatus,
} from '@optionkart/types';
import {
  calculatePCR,
  calculateMaxPain,
  calculateSentiment,
  calculateMFI,
  isMarketOpen,
  getNextMarketOpen,
} from '@optionkart/utils';

const INDEX_CONFIG: Record<
  string,
  { spotBase: number; strikeStep: number; range: number }
> = {
  NIFTY: { spotBase: 24200, strikeStep: 50, range: 1200 },
  BANKNIFTY: { spotBase: 51000, strikeStep: 100, range: 2500 },
  FINNIFTY: { spotBase: 21500, strikeStep: 50, range: 1000 },
  MIDCPNIFTY: { spotBase: 14500, strikeStep: 50, range: 800 },
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStrikes(
  index: string,
  spot: number,
): {
  strikes: OptionStrike[];
  expiryDate: string;
  availableExpiries: string[];
} {
  const config = INDEX_CONFIG[index] ?? INDEX_CONFIG.NIFTY!;
  const { strikeStep, range } = config;

  const now = new Date();
  const thisThursday = new Date(now);
  thisThursday.setDate(
    now.getDate() + ((4 - now.getDay() + 7) % 7) + (now.getDay() > 4 ? 7 : 0),
  );
  const nextThursday = new Date(thisThursday);
  nextThursday.setDate(thisThursday.getDate() + 7);
  const monthlyExpiry = new Date(now.getFullYear(), now.getMonth() + 1, -1);
  monthlyExpiry.setDate(0); // last Thursday logic simplified

  const availableExpiries = [
    thisThursday.toISOString().slice(0, 10),
    nextThursday.toISOString().slice(0, 10),
  ];

  const expiryDate = availableExpiries[0]!;
  const halfRange = Math.floor(range / 2 / strikeStep) * strikeStep;
  const strikes: OptionStrike[] = [];

  for (let sp = spot - halfRange; sp <= spot + halfRange; sp += strikeStep) {
    const distFromATM = Math.abs(sp - spot);
    const baseOI = Math.max(
      10000,
      500000 - distFromATM * 1000 + randomBetween(-50000, 50000),
    );
    const atmFactor = Math.max(0.3, 1 - distFromATM / range);

    strikes.push({
      strikePrice: sp,
      expiryDate,
      callOI: Math.round(baseOI * (1 + randomBetween(-20, 20) / 100)),
      callOIChange: Math.round(randomBetween(-50000, 80000)),
      callLTP: Math.round(
        randomBetween(5, Math.max(10, 500 - distFromATM * 0.3)),
      ),
      callVolume: Math.round((baseOI * atmFactor * randomBetween(5, 30)) / 100),
      putOI: Math.round(baseOI * (1 + randomBetween(-20, 20) / 100)),
      putOIChange: Math.round(randomBetween(-50000, 80000)),
      putLTP: Math.round(
        randomBetween(5, Math.max(10, 500 - distFromATM * 0.3)),
      ),
      putVolume: Math.round((baseOI * atmFactor * randomBetween(5, 30)) / 100),
      callIV: parseFloat((12 + randomBetween(-20, 20) / 10).toFixed(1)),
      putIV: parseFloat((13 + randomBetween(-20, 20) / 10).toFixed(1)),
      isATM: Math.abs(sp - spot) <= strikeStep,
    });
  }

  return { strikes, expiryDate, availableExpiries };
}

@Injectable()
export class MockDataService {
  private dataCache = new Map<
    string,
    {
      dashboard: DashboardData;
      chain: OptionStrike[];
      spotPrice: number;
      fetchedAt: Date;
    }
  >();

  generate(index: string): {
    dashboard: DashboardData;
    chain: OptionStrike[];
    spotPrice: number;
  } {
    const config = INDEX_CONFIG[index] ?? INDEX_CONFIG.NIFTY!;
    const spotPrice = config.spotBase + randomBetween(-150, 150);

    const { strikes } = generateStrikes(index, spotPrice);

    const totalCallOI = strikes.reduce((s, st) => s + st.callOI, 0);
    const totalPutOI = strikes.reduce((s, st) => s + st.putOI, 0);
    const callOIChange = strikes.reduce((s, st) => s + st.callOIChange, 0);
    const putOIChange = strikes.reduce((s, st) => s + st.putOIChange, 0);

    const pcr = calculatePCR(strikes);
    const maxPain = calculateMaxPain(strikes);
    const sentiment = calculateSentiment(pcr, callOIChange, putOIChange);

    const totalCallVolume = strikes.reduce((s, st) => s + st.callVolume, 0);
    const totalPutVolume = strikes.reduce((s, st) => s + st.putVolume, 0);
    const { mfi, signal: mfiSignal } = calculateMFI(
      Math.max(callOIChange, 1),
      Math.max(totalCallVolume, 1),
      Math.max(putOIChange, 1),
      Math.max(totalPutVolume, 1),
    );

    const sortedByCallOI = [...strikes]
      .sort((a, b) => b.callOIChange - a.callOIChange)
      .slice(0, 5);
    const sortedByPutOI = [...strikes]
      .sort((a, b) => b.putOIChange - a.putOIChange)
      .slice(0, 5);

    const now = new Date();
    const marketOpen = isMarketOpen(now);

    const dashboard: DashboardData = {
      index,
      spotPrice,
      pcr,
      pcrTrend: pcr > 1.1 ? 'RISING' : pcr < 0.9 ? 'FALLING' : 'NEUTRAL',
      maxPain,
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      totalCallOI,
      totalPutOI,
      callOIChange,
      putOIChange,
      topCallBuildup: sortedByCallOI,
      topPutBuildup: sortedByPutOI,
      marketStatus: (marketOpen ? 'OPEN' : 'CLOSED') as MarketStatus,
      nextOpenAt: marketOpen ? null : getNextMarketOpen(now).toISOString(),
      isStale: false,
      staleAgeSeconds: 0,
      fetchedAt: now.toISOString(),
      vix: parseFloat((12 + randomBetween(-20, 20) / 10).toFixed(1)),
      mfi,
      mfiSignal,
    };

    return { dashboard, chain: strikes, spotPrice };
  }

  getCached(index: string):
    | {
        dashboard: DashboardData;
        chain: OptionStrike[];
        spotPrice: number;
        fetchedAt: Date;
      }
    | undefined {
    return this.dataCache.get(index);
  }

  setCached(
    index: string,
    data: {
      dashboard: DashboardData;
      chain: OptionStrike[];
      spotPrice: number;
    },
  ) {
    this.dataCache.set(index, { ...data, fetchedAt: new Date() });
  }

  generateMockPcrHistory(
    index: string,
    count: number = 60,
  ): Array<{ pcr: number; timestamp: string }> {
    const now = new Date();
    const basePcr = INDEX_CONFIG[index] ? 0.85 + Math.random() * 0.4 : 1.0;

    return Array.from({ length: count }, (_, i) => {
      const t = new Date(now.getTime() - (count - 1 - i) * 3 * 60 * 1000);
      const jitter = (Math.random() - 0.5) * 0.15;
      return {
        pcr: parseFloat((basePcr + jitter).toFixed(3)),
        timestamp: t.toISOString(),
      };
    });
  }

  generateMockOiHistory(
    index: string,
    count: number = 60,
  ): Array<{ timestamp: string; totalCallOI: number; totalPutOI: number }> {
    const now = new Date();
    const config = INDEX_CONFIG[index] ?? INDEX_CONFIG.NIFTY!;
    const baseCallOI = config.spotBase * 150 + randomBetween(-100000, 100000);
    const basePutOI = config.spotBase * 160 + randomBetween(-100000, 100000);
    const callTrend = randomBetween(-500, 500);
    const putTrend = randomBetween(-500, 500);

    return Array.from({ length: count }, (_, i) => {
      const t = new Date(now.getTime() - (count - 1 - i) * 3 * 60 * 1000);
      const callJitter = randomBetween(-100000, 100000);
      const putJitter = randomBetween(-100000, 100000);
      return {
        timestamp: t.toISOString(),
        totalCallOI: baseCallOI + callTrend * i + callJitter,
        totalPutOI: basePutOI + putTrend * i + putJitter,
      };
    });
  }
}
