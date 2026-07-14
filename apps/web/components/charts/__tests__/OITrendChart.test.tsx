import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OITrendChart } from '../OITrendChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
}));

describe('OITrendChart', () => {
  it('shows loading skeleton', () => {
    const { container } = render(<OITrendChart data={undefined} isLoading={true} error={null} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows sign-in prompt on 401', () => {
    const error = { response: { status: 401 } } as any;
    render(<OITrendChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Sign in to view OI history.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/auth/magic-link',
    );
  });

  it('shows upgrade prompt on 403', () => {
    const error = { response: { status: 403 } } as any;
    render(<OITrendChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Upgrade your plan to view OI history.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Plans' })).toHaveAttribute('href', '/pricing');
  });

  it('shows generic error on unknown error', () => {
    const error = new Error('network error');
    render(<OITrendChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Failed to load OI history.')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    render(<OITrendChart data={[]} isLoading={false} error={null} />);
    expect(screen.getByText('No OI history data available.')).toBeTruthy();
  });

  it('renders chart with data', () => {
    const data = [{ timestamp: '2026-07-14T06:00:00Z', totalCallOI: 5000000, totalPutOI: 5200000 }];
    render(<OITrendChart data={data} isLoading={false} error={null} />);
    expect(screen.getByText('OI Trend (Cr)')).toBeTruthy();
  });
});
