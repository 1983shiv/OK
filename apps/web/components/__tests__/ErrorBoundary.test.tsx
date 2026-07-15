import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Working</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Working')).toBeDefined();
  });

  it('renders fallback on error', () => {
    const Throws = () => {
      throw new Error('test error');
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <Throws />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Error occurred')).toBeDefined();
  });
});
