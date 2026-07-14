import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OIHeatmap } from '../OIHeatmap';

describe('OIHeatmap', () => {
  it('shows loading skeleton', () => {
    const { container } = render(<OIHeatmap data={undefined} isLoading={true} error={null} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows sign-in prompt on 401', () => {
    const error = { response: { status: 401 } } as any;
    render(<OIHeatmap data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Sign in to view OI heatmap.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/auth/magic-link',
    );
  });

  it('shows upgrade prompt on 403', () => {
    const error = { response: { status: 403 } } as any;
    render(<OIHeatmap data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Upgrade your plan to view OI heatmap.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Plans' })).toHaveAttribute('href', '/pricing');
  });

  it('shows generic error on unknown error', () => {
    const error = new Error('network error');
    render(<OIHeatmap data={undefined} isLoading={false} error={error} />);
    expect(screen.getByText('Failed to load heatmap.')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    render(<OIHeatmap data={[]} isLoading={false} error={null} />);
    expect(screen.getByText('No heatmap data available.')).toBeTruthy();
  });

  it('renders strikes with sort toggle', () => {
    const data = [
      { strikePrice: 24200, callOI: 100000, putOI: 120000, oiChange: 5000 },
      { strikePrice: 24250, callOI: 80000, putOI: 90000, oiChange: -3000 },
    ];
    render(<OIHeatmap data={data} isLoading={false} error={null} />);
    expect(screen.getByText('OI Heatmap')).toBeTruthy();
    expect(screen.getByText('24200')).toBeTruthy();
    expect(screen.getByText('24250')).toBeTruthy();
    expect(screen.getByText('By Strike')).toBeTruthy();
  });

  it('toggles sort option', () => {
    const data = [
      { strikePrice: 24200, callOI: 100000, putOI: 120000, oiChange: 5000 },
      { strikePrice: 24250, callOI: 80000, putOI: 90000, oiChange: -3000 },
    ];
    render(<OIHeatmap data={data} isLoading={false} error={null} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'oiChange' } });
    expect((select as HTMLSelectElement).value).toBe('oiChange');
  });
});
