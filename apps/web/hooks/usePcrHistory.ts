'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api-client';
import type { ApiResponse, PcrHistoryPoint } from '../lib/types';

export function usePcrHistory(index = 'NIFTY') {
  return useQuery({
    queryKey: ['pcr-history', index],
    queryFn: () =>
      apiGet<ApiResponse<PcrHistoryPoint[]>>(`/market/pcr/${index}/history`).then((r) => r.data),
    refetchInterval: 60_000,
  });
}
