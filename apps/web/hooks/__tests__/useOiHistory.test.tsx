import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOiHistory } from '../useOiHistory';

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

describe('useOiHistory', () => {
  it('calls /market/oi-history/NIFTY by default', async () => {
    mockApiGet.mockResolvedValue({
      data: [{ timestamp: '2026-07-14T06:00:00Z', totalCallOI: 5000000, totalPutOI: 5200000 }],
    });
    const { result } = renderHook(() => useOiHistory(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/oi-history/NIFTY');
  });

  it('calls custom index endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useOiHistory('BANKNIFTY'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/market/oi-history/BANKNIFTY');
  });

  it('returns error when API fails', async () => {
    mockApiGet.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useOiHistory(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
