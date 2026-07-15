import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnusualActivityTable } from '../UnusualActivityTable';

describe('UnusualActivityTable', () => {
  it('shows loading skeleton', () => {
    const { container } = render(
      <UnusualActivityTable data={undefined} isLoading={true} error={null} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows sign-in prompt on 401', () => {
    const error = { response: { status: 401 } } as unknown as Error;
    render(<UnusualActivityTable data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Sign in to view unusual activity.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/auth/magic-link',
    );
  });

  it('shows upgrade prompt on 403', () => {
    const error = { response: { status: 403 } } as unknown as Error;
    render(<UnusualActivityTable data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Upgrade your plan to view unusual activity.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Plans' })).toHaveAttribute('href', '/pricing');
  });

  it('shows generic error on unknown error', () => {
    const error = new Error('network error');
    render(<UnusualActivityTable data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Failed to load unusual activity.')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    render(<UnusualActivityTable data={[]} isLoading={false} error={null} />);
    expect(screen.getByText('No unusual activity detected.')).toBeTruthy();
  });

  it('renders table with activity data', () => {
    const data = [
      {
        strikePrice: 24200,
        expiryDate: '2026-07-16',
        callOIChange: 60000,
        putOIChange: -20000,
        callVolume: 15000,
        putVolume: 8000,
      },
    ];
    render(<UnusualActivityTable data={data} isLoading={false} error={null} />);
    expect(screen.getByText('Unusual Activity')).toBeTruthy();
    expect(screen.getByText('24,200')).toBeTruthy();
    expect(screen.getByText(/Jul/)).toBeTruthy();
    expect(screen.getByText('+0.6L')).toBeTruthy();
  });
});
