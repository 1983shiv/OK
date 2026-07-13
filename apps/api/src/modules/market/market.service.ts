import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { isMarketOpen } from '@optionkart/utils';
import { MarketCacheService } from './market-cache.service';
import { MockDataService } from './mock-data.service';
import { UpstoxService } from './upstox.service';
import { OISnapshot } from '../../mongoose/oi-snapshot.schema';
import type { DashboardData, OptionStrike } from '@optionkart/types';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly SUPPORTED_INDICES = [
    'NIFTY',
    'BANKNIFTY',
    'FINNIFTY',
    'MIDCPNIFTY',
  ];

  constructor(
    private readonly cacheService: MarketCacheService,
    private readonly mockDataService: MockDataService,
    private readonly upstoxService: UpstoxService,
    @InjectModel(OISnapshot.name)
    private readonly oiSnapshotModel: Model<OISnapshot>,
  ) {}

  @Cron('*/3 * * * *')
  async scheduledPoll() {
    if (!isMarketOpen(new Date())) return;

    for (const index of this.SUPPORTED_INDICES) {
      await this.fetchAndCache(index).catch((err) =>
        this.logger.error(`Scheduled poll failed for ${index}`, err),
      );
    }
  }

  async fetchAndCache(index: string): Promise<void> {
    if (this.upstoxService.isConfigured()) {
      await this.fetchFromUpstox(index);
    } else {
      this.fetchFromMock(index);
    }
  }

  private fetchFromMock(index: string): void {
    const data = this.mockDataService.generate(index);
    this.mockDataService.setCached(index, data);

    const chainJson = JSON.stringify(data.chain);
    const dashJson = JSON.stringify(data.dashboard);
    const spotJson = JSON.stringify({
      price: data.spotPrice,
      fetchedAt: data.dashboard.fetchedAt,
    });

    this.cacheService.setChain(index, chainJson).catch(() => {});
    this.cacheService.setDashboard(index, dashJson).catch(() => {});
    this.cacheService.setSpot(index, spotJson).catch(() => {});

    this.saveSnapshot(index, data).catch(() => {});
  }

  private async fetchFromUpstox(index: string): Promise<void> {
    // Upstox real data pipeline — placeholder for full integration
    this.fetchFromMock(index);
  }

  private async saveSnapshot(
    index: string,
    data: {
      dashboard: DashboardData;
      chain: OptionStrike[];
      spotPrice: number;
    },
  ) {
    await this.oiSnapshotModel.create({
      index,
      spotPrice: data.spotPrice,
      strikes: data.chain.map((s) => ({
        strikePrice: s.strikePrice,
        expiryDate: s.expiryDate,
        callOI: s.callOI,
        callOIChange: s.callOIChange,
        callLTP: s.callLTP,
        callVolume: s.callVolume,
        putOI: s.putOI,
        putOIChange: s.putOIChange,
        putLTP: s.putLTP,
        putVolume: s.putVolume,
        callIV: s.callIV,
        putIV: s.putIV,
      })),
      expiryDate: data.dashboard.fetchedAt,
      availableExpiries: [],
      pcr: data.dashboard.pcr,
      maxPain: data.dashboard.maxPain,
      fetchedAt: new Date(),
    });
  }

  async getDashboard(index: string): Promise<DashboardData> {
    const cached = await this.cacheService.getDashboard(index);
    if (cached) return JSON.parse(cached) as DashboardData;

    const mockData = this.mockDataService.getCached(index);
    if (mockData) return mockData.dashboard;

    // Fallback: generate fresh mock data
    const fresh = this.mockDataService.generate(index);
    this.mockDataService.setCached(index, fresh);
    return fresh.dashboard;
  }

  async getChain(index: string): Promise<{
    chain: OptionStrike[];
    expiryDate: string;
    availableExpiries: string[];
  }> {
    const cached = await this.cacheService.getChain(index);
    if (cached) {
      const chain = JSON.parse(cached) as OptionStrike[];
      return {
        chain,
        expiryDate: chain[0]?.expiryDate ?? '',
        availableExpiries: [],
      };
    }

    const mockData = this.mockDataService.getCached(index);
    if (mockData) {
      return {
        chain: mockData.chain,
        expiryDate: mockData.chain[0]?.expiryDate ?? '',
        availableExpiries: [],
      };
    }

    const fresh = this.mockDataService.generate(index);
    this.mockDataService.setCached(index, fresh);
    return {
      chain: fresh.chain,
      expiryDate: fresh.chain[0]?.expiryDate ?? '',
      availableExpiries: [],
    };
  }

  async getSpot(index: string): Promise<{ price: number; fetchedAt: string }> {
    const cached = await this.cacheService.getSpot(index);
    if (cached)
      return JSON.parse(cached) as { price: number; fetchedAt: string };

    const mockData =
      this.mockDataService.getCached(index) ??
      this.mockDataService.generate(index);
    return {
      price: mockData.spotPrice,
      fetchedAt: mockData.dashboard.fetchedAt,
    };
  }

  async getPCR(index: string): Promise<{ pcr: number; pcrTrend: string }> {
    const dash = await this.getDashboard(index);
    return { pcr: dash.pcr, pcrTrend: dash.pcrTrend };
  }

  async getMaxPain(
    index: string,
  ): Promise<{ maxPain: number; spotPrice: number }> {
    const dash = await this.getDashboard(index);
    return { maxPain: dash.maxPain, spotPrice: dash.spotPrice };
  }

  async getSupportResistance(
    index: string,
  ): Promise<{ support: number; resistance: number; spotPrice: number }> {
    const dash = await this.getDashboard(index);
    const chain = await this.getChain(index);

    const oiByStrike = new Map<number, { callOI: number; putOI: number }>();
    for (const s of chain.chain) {
      const existing = oiByStrike.get(s.strikePrice) ?? { callOI: 0, putOI: 0 };
      existing.callOI += s.callOI;
      existing.putOI += s.putOI;
      oiByStrike.set(s.strikePrice, existing);
    }

    let maxCallOI = 0;
    let resistance = dash.spotPrice;
    let maxPutOI = 0;
    let support = dash.spotPrice;

    for (const [strike, oi] of oiByStrike) {
      if (strike > dash.spotPrice && oi.callOI > maxCallOI) {
        maxCallOI = oi.callOI;
        resistance = strike;
      }
      if (strike < dash.spotPrice && oi.putOI > maxPutOI) {
        maxPutOI = oi.putOI;
        support = strike;
      }
    }

    return { support, resistance, spotPrice: dash.spotPrice };
  }

  async getPCRHistory(
    index: string,
  ): Promise<Array<{ pcr: number; timestamp: string }>> {
    const snapshots = await this.oiSnapshotModel
      .find({ index })
      .sort({ fetchedAt: -1 })
      .limit(100)
      .lean();

    if (snapshots.length === 0) {
      return this.mockDataService.generateMockPcrHistory(index);
    }

    return snapshots.map((s) => ({
      pcr: (s as any).pcr as number,
      timestamp: (s as any).fetchedAt.toISOString(),
    }));
  }

  async getHeatmap(index: string): Promise<
    Array<{
      strikePrice: number;
      callOI: number;
      putOI: number;
      oiChange: number;
    }>
  > {
    const chain = await this.getChain(index);

    return chain.chain.map((s) => ({
      strikePrice: s.strikePrice,
      callOI: s.callOI,
      putOI: s.putOI,
      oiChange: s.callOIChange + s.putOIChange,
    }));
  }

  async getOIHistory(
    index: string,
  ): Promise<
    Array<{ timestamp: string; totalCallOI: number; totalPutOI: number }>
  > {
    const snapshots = await this.oiSnapshotModel
      .find({ index })
      .sort({ fetchedAt: -1 })
      .limit(100)
      .lean();

    if (snapshots.length === 0) {
      return this.mockDataService.generateMockOiHistory(index);
    }

    return snapshots.map((s) => {
      const strikes = (s as any).strikes as
        | Array<{ callOI: number; putOI: number }>
        | undefined;
      return {
        timestamp: (s as any).fetchedAt.toISOString(),
        totalCallOI: strikes?.reduce((sum, st) => sum + st.callOI, 0) ?? 0,
        totalPutOI: strikes?.reduce((sum, st) => sum + st.putOI, 0) ?? 0,
      };
    });
  }

  async getUnusualActivity(index: string): Promise<
    Array<{
      strikePrice: number;
      expiryDate: string;
      callOIChange: number;
      putOIChange: number;
      callVolume: number;
      putVolume: number;
    }>
  > {
    const chain = await this.getChain(index);

    return chain.chain
      .filter(
        (s) =>
          Math.abs(s.callOIChange) > 50000 || Math.abs(s.putOIChange) > 50000,
      )
      .map((s) => ({
        strikePrice: s.strikePrice,
        expiryDate: s.expiryDate,
        callOIChange: s.callOIChange,
        putOIChange: s.putOIChange,
        callVolume: s.callVolume,
        putVolume: s.putVolume,
      }))
      .slice(0, 20);
  }
}
