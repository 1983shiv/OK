import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api-client';

interface DailyBriefResponse {
  brief: string | null;
  date: string | null;
  message?: string;
}

export function useDailyBrief(index: string = 'NIFTY') {
  return useQuery<DailyBriefResponse>({
    queryKey: ['dailyBrief', index],
    queryFn: () => apiGet<DailyBriefResponse>(`/ai/daily-brief/${index}`),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
