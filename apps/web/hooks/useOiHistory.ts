'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api-client';
import type { ApiResponse, OiHistoryPoint } from '../lib/types';

export function useOiHistory(index = 'NIFTY') {
  return useQuery({
    queryKey: ['oi-history', index],
    queryFn: () =>
      apiGet<ApiResponse<OiHistoryPoint[]>>(`/market/oi-history/${index}`).then((r) => r.data),
    refetchInterval: 60_000,
  });
}
