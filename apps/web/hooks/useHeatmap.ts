'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api-client';
import type { ApiResponse, HeatmapPoint } from '../lib/types';

export function useHeatmap(index = 'NIFTY') {
  return useQuery({
    queryKey: ['heatmap', index],
    queryFn: () =>
      apiGet<ApiResponse<HeatmapPoint[]>>(`/market/heatmap/${index}`).then((r) => r.data),
    refetchInterval: 60_000,
  });
}
