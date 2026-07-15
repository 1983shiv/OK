import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUnusualActivity } from '../useUnusualActivity';

const mockApiGet = vi.fn();
vi.mock('../../lib/api-client', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useUnusualActivity', () => {
  it('calls /market/unusual-activity/NIFTY by default', async () => {
    mockApiGet.mockResolvedValue({
      data: [
        {
          strikePrice: 24200,
          expiryDate: '2026-07-16',
          callOIChange: 60000,
          putOIChange: -20000,
          callVolume: 15000,
          putVolume: 8000,
        },
      ],
    });
    const { result } = renderHook(() => useUnusualActivity(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/unusual-activity/NIFTY');
  });

  it('calls custom index endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useUnusualActivity('BANKNIFTY'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/unusual-activity/BANKNIFTY');
  });

  it('returns error when API fails', async () => {
    mockApiGet.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useUnusualActivity(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
