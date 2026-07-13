'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiResponse, DashboardData } from '../lib/types';

export function useDashboard(index = 'NIFTY') {
  return useQuery({
    queryKey: ['dashboard', index],
    queryFn: () =>
      axios
        .get<
          ApiResponse<DashboardData>
        >(`${process.env.NEXT_PUBLIC_API_URL}/market/dashboard/${index}`)
        .then((r) => r.data.data),
    refetchInterval: 30_000,
  });
}
