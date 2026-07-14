import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePcrHistory } from '../usePcrHistory';

const mockApiGet = vi.fn();
vi.mock('../../lib/api-client', () => ({
  apiGet: (...args: any[]) => mockApiGet(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('usePcrHistory', () => {
  it('calls /market/pcr/NIFTY/history by default', async () => {
    mockApiGet.mockResolvedValue({ data: [{ pcr: 1.05, timestamp: '2026-07-14T06:00:00Z' }] });
    const { result } = renderHook(() => usePcrHistory(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/pcr/NIFTY/history');
    expect(result.current.data).toEqual([{ pcr: 1.05, timestamp: '2026-07-14T06:00:00Z' }]);
  });

  it('calls custom index endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => usePcrHistory('BANKNIFTY'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/pcr/BANKNIFTY/history');
  });

  it('returns error when API fails', async () => {
    mockApiGet.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => usePcrHistory(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
