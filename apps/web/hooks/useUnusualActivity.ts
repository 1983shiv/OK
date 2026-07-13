'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api-client';
import type { ApiResponse, UnusualActivityItem } from '../lib/types';

export function useUnusualActivity(index = 'NIFTY') {
  return useQuery({
    queryKey: ['unusual-activity', index],
    queryFn: () =>
      apiGet<ApiResponse<UnusualActivityItem[]>>(`/market/unusual-activity/${index}`).then(
        (r) => r.data,
      ),
    refetchInterval: 60_000,
  });
}
