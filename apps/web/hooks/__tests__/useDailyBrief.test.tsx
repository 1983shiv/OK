import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDailyBrief } from '../useDailyBrief';

const mockApiGet = vi.fn();
vi.mock('../../lib/api-client', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDailyBrief', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
  });

  it('calls /ai/daily-brief/NIFTY by default', async () => {
    mockApiGet.mockResolvedValue({ brief: 'NIFTY ended higher', date: '2026-07-14' });
    const { result } = renderHook(() => useDailyBrief(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/ai/daily-brief/NIFTY');
  });

  it('calls custom index endpoint', async () => {
    mockApiGet.mockResolvedValue({ brief: null, date: null });
    const { result } = renderHook(() => useDailyBrief('BANKNIFTY'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiGet).toHaveBeenCalledWith('/ai/daily-brief/BANKNIFTY');
  });

  it('handles null brief response', async () => {
    mockApiGet.mockResolvedValue({ brief: null, date: null });
    const { result } = renderHook(() => useDailyBrief(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.brief).toBeNull();
  });

  it('handles error state', async () => {
    mockApiGet.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useDailyBrief(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
