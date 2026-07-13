'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { OiHistoryPoint } from '../../lib/types';

export function OITrendChart({
  data,
  isLoading,
  error,
}: {
  data: OiHistoryPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-24 bg-[var(--surface-hover)] rounded mb-4" />
        <div className="h-48 bg-[var(--surface-hover)] rounded" />
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 401) {
      return (
        <div className="card p-4 text-center">
          <p className="text-sm text-[var(--muted)]">Sign in to view OI history.</p>
          <a
            href="/auth/magic-link"
            className="inline-block mt-2 px-4 py-1.5 rounded bg-[var(--brand)] text-white text-xs font-medium hover:bg-[var(--brand-hover)] transition-colors"
          >
            Sign In
          </a>
        </div>
      );
    }
    if (status === 403) {
      return (
        <div className="card p-4 text-center">
          <p className="text-sm text-[var(--muted)]">Upgrade your plan to view OI history.</p>
          <a
            href="/pricing"
            className="inline-block mt-2 px-4 py-1.5 rounded bg-[var(--brand)] text-white text-xs font-medium hover:bg-[var(--brand-hover)] transition-colors"
          >
            View Plans
          </a>
        </div>
      );
    }
    return (
      <div className="card p-4 text-center text-sm text-[var(--bearish)]">
        Failed to load OI history.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-[var(--muted)]">
        No OI history data available.
      </div>
    );
  }

  const formatted = data
    .map((p) => ({
      ...p,
      time: new Date(p.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }),
      callCr: parseFloat((p.totalCallOI / 1_00_00_000).toFixed(2)),
      putCr: parseFloat((p.totalPutOI / 1_00_00_000).toFixed(2)),
    }))
    .reverse();

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">OI Trend (Cr)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
              }}
              formatter={(value) => [`${Number(value).toFixed(2)} Cr`]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
            <Line
              type="monotone"
              dataKey="callCr"
              stroke="var(--bearish)"
              strokeWidth={2}
              dot={false}
              name="Call OI"
            />
            <Line
              type="monotone"
              dataKey="putCr"
              stroke="var(--bullish)"
              strokeWidth={2}
              dot={false}
              name="Put OI"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
