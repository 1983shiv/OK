'use client';

import type { UnusualActivityItem } from '../../lib/types';

export function UnusualActivityTable({
  data,
  isLoading,
  error,
}: {
  data: UnusualActivityItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface-hover)] rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--surface-hover)] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 401) {
      return (
        <div className="card p-4 text-center">
          <p className="text-sm text-[var(--muted)]">Sign in to view unusual activity.</p>
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
          <p className="text-sm text-[var(--muted)]">Upgrade your plan to view unusual activity.</p>
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
        Failed to load unusual activity.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-[var(--muted)]">
        No unusual activity detected.
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">Unusual Activity</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--muted)] border-b border-[var(--border)]">
              <th className="text-left py-2 pr-2">Strike</th>
              <th className="text-left py-2 pr-2">Expiry</th>
              <th className="text-right py-2 pr-2">Call OI Chg</th>
              <th className="text-right py-2 pr-2">Put OI Chg</th>
              <th className="text-right py-2 pr-2">Call Vol</th>
              <th className="text-right py-2">Put Vol</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={`${item.strikePrice}-${item.expiryDate}-${i}`}
                className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                <td className="py-2 pr-2 font-medium">
                  {item.strikePrice.toLocaleString('en-IN')}
                </td>
                <td className="py-2 pr-2 text-[var(--muted)]">
                  {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td
                  className={`py-2 pr-2 text-right font-medium ${item.callOIChange >= 0 ? 'text-[var(--bearish)]' : 'text-[var(--bullish)]'}`}
                >
                  {item.callOIChange >= 0 ? '+' : ''}
                  {(item.callOIChange / 1_00_000).toFixed(1)}L
                </td>
                <td
                  className={`py-2 pr-2 text-right font-medium ${item.putOIChange >= 0 ? 'text-[var(--bullish)]' : 'text-[var(--bearish)]'}`}
                >
                  {item.putOIChange >= 0 ? '+' : ''}
                  {(item.putOIChange / 1_00_000).toFixed(1)}L
                </td>
                <td className="py-2 pr-2 text-right text-[var(--muted)]">
                  {item.callVolume.toLocaleString('en-IN')}
                </td>
                <td className="py-2 text-right text-[var(--muted)]">
                  {item.putVolume.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
