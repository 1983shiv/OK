import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCRHistoryChart } from '../PCRHistoryChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
}));

describe('PCRHistoryChart', () => {
  it('shows loading skeleton', () => {
    const { container } = render(
      <PCRHistoryChart data={undefined} isLoading={true} error={null} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows sign-in prompt on 401', () => {
    const error = { response: { status: 401 } } as unknown as Error;
    render(<PCRHistoryChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Sign in to view PCR history.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/auth/magic-link',
    );
  });

  it('shows upgrade prompt on 403', () => {
    const error = { response: { status: 403 } } as unknown as Error;
    render(<PCRHistoryChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Upgrade your plan to view PCR history.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Plans' })).toHaveAttribute('href', '/pricing');
  });

  it('shows generic error on unknown error', () => {
    const error = new Error('network error');
    render(<PCRHistoryChart data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Failed to load PCR history.')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    render(<PCRHistoryChart data={[]} isLoading={false} error={null} />);
    expect(screen.getByText('No PCR history data available.')).toBeTruthy();
  });

  it('renders chart with data', () => {
    const data = [
      { pcr: 1.05, timestamp: '2026-07-14T06:00:00Z' },
      { pcr: 1.03, timestamp: '2026-07-14T06:03:00Z' },
    ];
    render(<PCRHistoryChart data={data} isLoading={false} error={null} />);
    expect(screen.getByText('PCR History')).toBeTruthy();
  });
});
