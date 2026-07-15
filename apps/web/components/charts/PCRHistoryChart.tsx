'use client';

import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { PcrHistoryPoint } from '../../lib/types';

interface AxiosErrorLike {
  response?: { status: number };
}

function authErrorCard(message: string, action: string, href: string) {
  return (
    <div className="card p-4 text-center">
      <p className="text-sm text-[var(--muted)]">{message}</p>
      <Link
        href={href}
        className="inline-block mt-2 px-4 py-1.5 rounded bg-[var(--brand)] text-white text-xs font-medium hover:bg-[var(--brand-hover)] transition-colors"
      >
        {action}
      </Link>
    </div>
  );
}

export function PCRHistoryChart({
  data,
  isLoading,
  error,
}: {
  data: PcrHistoryPoint[] | undefined;
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
    const status = (error as AxiosErrorLike)?.response?.status;
    if (status === 401) {
      return authErrorCard('Sign in to view PCR history.', 'Sign In', '/auth/magic-link');
    }
    if (status === 403) {
      return authErrorCard('Upgrade your plan to view PCR history.', 'View Plans', '/pricing');
    }
    return (
      <div className="card p-4 text-center text-sm text-[var(--bearish)]">
        Failed to load PCR history.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-[var(--muted)]">
        No PCR history data available.
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
    }))
    .reverse();

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">PCR History</h3>
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
              domain={[0.5, 1.8]}
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
              formatter={(value) => [Number(value).toFixed(3), 'PCR']}
            />
            <Line
              type="monotone"
              dataKey="pcr"
              stroke="var(--neutral)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
