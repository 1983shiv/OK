'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SentimentCard } from '../../../components/dashboard/SentimentCard';
import { PCRGauge } from '../../../components/dashboard/PCRGauge';
import { OIBarChart } from '../../../components/dashboard/OIBarChart';
import { TopMovers } from '../../../components/dashboard/TopMovers';
import { VixWidget } from '../../../components/dashboard/VixWidget';
import { SmartMoneyGauge } from '../../../components/dashboard/SmartMoneyGauge';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { usePcrHistory } from '../../../hooks/usePcrHistory';
import { useOiHistory } from '../../../hooks/useOiHistory';
import { useHeatmap } from '../../../hooks/useHeatmap';
import { useUnusualActivity } from '../../../hooks/useUnusualActivity';
import { useDailyBrief } from '../../../hooks/useDailyBrief';
import { trackEvent } from '../../../lib/analytics';
import type { ApiResponse, DashboardData } from '../../../lib/types';

const PCRHistoryChart = dynamic(
  () => import('../../../components/charts/PCRHistoryChart').then((m) => m.PCRHistoryChart),
  { ssr: false },
);
const OITrendChart = dynamic(
  () => import('../../../components/charts/OITrendChart').then((m) => m.OITrendChart),
  { ssr: false },
);
const OIHeatmap = dynamic(
  () => import('../../../components/charts/OIHeatmap').then((m) => m.OIHeatmap),
  { ssr: false },
);
const UnusualActivityTable = dynamic(
  () =>
    import('../../../components/charts/UnusualActivityTable').then((m) => m.UnusualActivityTable),
  { ssr: false },
);

function fetchDashboard(index: string) {
  return axios
    .get<ApiResponse<DashboardData>>(`${process.env.NEXT_PUBLIC_API_URL}/market/dashboard/${index}`)
    .then((r) => r.data.data);
}

export default function DashboardPage() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard', 'NIFTY'],
    queryFn: () => fetchDashboard('NIFTY'),
    refetchInterval: 30_000,
  });

  const pcrHistory = usePcrHistory('NIFTY');
  const oiHistory = useOiHistory('NIFTY');
  const heatmap = useHeatmap('NIFTY');
  const unusual = useUnusualActivity('NIFTY');
  const dailyBrief = useDailyBrief('NIFTY');
  const tracked = useRef(false);

  useEffect(() => {
    if (data && !tracked.current) {
      tracked.current = true;
      trackEvent('dashboard_loaded', {
        index: data.index,
        load_time_ms: dataUpdatedAt ? Date.now() - dataUpdatedAt : undefined,
      });
    }
  }, [data, dataUpdatedAt]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--bearish)]">Failed to load dashboard data.</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          Make sure the API server is running on port 3001.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{data.index}</h1>
        <span className="text-2xl font-semibold">{data.spotPrice.toLocaleString('en-IN')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <SentimentCard sentiment={data.sentiment} score={data.sentimentScore} />
        <PCRGauge pcr={data.pcr} trend={data.pcrTrend} />
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-sm text-[var(--muted)]">Max Pain</span>
          <span className="text-xl font-semibold">{data.maxPain.toLocaleString('en-IN')}</span>
          <span className="text-xs text-[var(--muted)]">
            Spot: {data.spotPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-sm text-[var(--muted)]">Market</span>
          <span
            className={`text-lg font-semibold ${data.marketStatus === 'OPEN' ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}
          >
            {data.marketStatus}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {new Date(data.fetchedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </span>
        </div>
        <VixWidget vix={data.vix} marketStatus={data.marketStatus} />
        <SmartMoneyGauge mfi={data.mfi} signal={data.mfiSignal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OIBarChart totalCallOI={data.totalCallOI} totalPutOI={data.totalPutOI} />
        <div className="card p-4">
          <h3 className="text-sm font-medium mb-3">OI Change</h3>
          <div className="flex gap-6">
            <div>
              <span className="text-xs text-[var(--muted)]">Call OI</span>
              <p
                className={`text-lg font-semibold ${data.callOIChange >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}
              >
                {(data.callOIChange / 1_00_000).toFixed(1)}L
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--muted)]">Put OI</span>
              <p
                className={`text-lg font-semibold ${data.putOIChange >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}
              >
                {(data.putOIChange / 1_00_000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopMovers title="Top Call OI Buildup" items={data.topCallBuildup} field="callOIChange" />
        <TopMovers title="Top Put OI Buildup" items={data.topPutBuildup} field="putOIChange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorBoundary>
          <PCRHistoryChart
            data={pcrHistory.data}
            isLoading={pcrHistory.isLoading}
            error={pcrHistory.error}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <OITrendChart
            data={oiHistory.data}
            isLoading={oiHistory.isLoading}
            error={oiHistory.error}
          />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ErrorBoundary>
          <OIHeatmap data={heatmap.data} isLoading={heatmap.isLoading} error={heatmap.error} />
        </ErrorBoundary>
        <ErrorBoundary>
          <UnusualActivityTable
            data={unusual.data}
            isLoading={unusual.isLoading}
            error={unusual.error}
          />
        </ErrorBoundary>
      </div>

      {dailyBrief.data?.brief && (
        <div className="card p-4">
          <h3 className="text-sm font-medium mb-2">Daily Brief — {dailyBrief.data.date}</h3>
          <div className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
            {dailyBrief.data.brief}
          </div>
        </div>
      )}
    </div>
  );
}
