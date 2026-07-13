'use client';

import { useState, useMemo } from 'react';
import type { HeatmapPoint } from '../../lib/types';

function heatColor(value: number): string {
  if (value > 50000) return '#ef4444';
  if (value > 20000) return '#f87171';
  if (value > 5000) return '#fca5a5';
  if (value < -50000) return '#22c55e';
  if (value < -20000) return '#4ade80';
  if (value < -5000) return '#86efac';
  return 'var(--surface-hover)';
}

export function OIHeatmap({
  data,
  isLoading,
  error,
}: {
  data: HeatmapPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  const [sortBy, setSortBy] = useState<'strike' | 'oiChange'>('strike');

  const sorted = useMemo(() => {
    if (!data) return [];
    const arr = [...data];
    if (sortBy === 'oiChange') {
      arr.sort((a, b) => Math.abs(b.oiChange) - Math.abs(a.oiChange));
    } else {
      arr.sort((a, b) => a.strikePrice - b.strikePrice);
    }
    return arr.slice(0, 50);
  }, [data, sortBy]);

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-24 bg-[var(--surface-hover)] rounded mb-4" />
        <div className="h-64 bg-[var(--surface-hover)] rounded" />
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 401) {
      return (
        <div className="card p-4 text-center">
          <p className="text-sm text-[var(--muted)]">Sign in to view OI heatmap.</p>
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
          <p className="text-sm text-[var(--muted)]">Upgrade your plan to view OI heatmap.</p>
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
        Failed to load heatmap.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-[var(--muted)]">
        No heatmap data available.
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">OI Heatmap</h3>
        <select
          className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--muted)]"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'strike' | 'oiChange')}
        >
          <option value="strike">By Strike</option>
          <option value="oiChange">By OI Change</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max" style={{ maxHeight: 280, overflowY: 'auto' }}>
          {sorted.map((s) => (
            <div
              key={s.strikePrice}
              className="flex flex-col items-center p-1.5 rounded"
              style={{
                backgroundColor: heatColor(s.oiChange),
                minWidth: 48,
              }}
              title={`Strike: ${s.strikePrice}
Call OI: ${(s.callOI / 1_00_000).toFixed(1)}L
Put OI: ${(s.putOI / 1_00_000).toFixed(1)}L
OI Change: ${s.oiChange >= 0 ? '+' : ''}${(s.oiChange / 1_00_000).toFixed(1)}L`}
            >
              <span className="text-xs font-medium">{s.strikePrice}</span>
              <span
                className={`text-[10px] ${s.oiChange >= 0 ? 'text-[var(--bearish)]' : 'text-[var(--bullish)]'}`}
              >
                {s.oiChange >= 0 ? '+' : ''}
                {(s.oiChange / 1_00_000).toFixed(1)}L
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--muted)]">
        <span>OI Change:</span>
        <span className="w-3 h-3 rounded bg-[#22c55e]" />
        <span>Strong Put</span>
        <span className="w-3 h-3 rounded bg-[#86efac]" />
        <span>Mild Put</span>
        <span className="w-3 h-3 rounded bg-[var(--surface-hover)]" />
        <span>Neutral</span>
        <span className="w-3 h-3 rounded bg-[#fca5a5]" />
        <span>Mild Call</span>
        <span className="w-3 h-3 rounded bg-[#ef4444]" />
        <span>Strong Call</span>
      </div>
    </div>
  );
}
