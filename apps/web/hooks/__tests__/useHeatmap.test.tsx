import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHeatmap } from '../useHeatmap';

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

describe('useHeatmap', () => {
  it('calls /market/heatmap/NIFTY by default', async () => {
    mockApiGet.mockResolvedValue({
      data: [{ strikePrice: 24200, callOI: 100000, putOI: 120000, oiChange: 5000 }],
    });
    const { result } = renderHook(() => useHeatmap(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/heatmap/NIFTY');
  });

  it('calls custom index endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useHeatmap('BANKNIFTY'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/heatmap/BANKNIFTY');
  });

  it('returns error when API fails', async () => {
    mockApiGet.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useHeatmap(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
