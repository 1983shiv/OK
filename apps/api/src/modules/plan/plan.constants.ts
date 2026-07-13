import type { PlanLimits } from '@optionkart/types';

type PlanKey = 'FREE' | 'STARTER' | 'PRO' | 'ELITE';

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  FREE: {
    watchlistItems: 5,
    alerts: 3,
    aiQueriesPerDay: 5,
    historicalDataDays: 0,
    heatmapAccess: false,
    multiExpiryAccess: false,
    telegramAlerts: false,
    strategyAI: false,
    dailyBrief: false,
    byoOpenAIKey: false,
  },
  STARTER: {
    watchlistItems: 15,
    alerts: 10,
    aiQueriesPerDay: 30,
    historicalDataDays: 7,
    heatmapAccess: true,
    multiExpiryAccess: true,
    telegramAlerts: false,
    strategyAI: false,
    dailyBrief: false,
    byoOpenAIKey: false,
  },
  PRO: {
    watchlistItems: 30,
    alerts: 25,
    aiQueriesPerDay: 100,
    historicalDataDays: 30,
    heatmapAccess: true,
    multiExpiryAccess: true,
    telegramAlerts: true,
    strategyAI: true,
    dailyBrief: true,
    byoOpenAIKey: false,
  },
  ELITE: {
    watchlistItems: 50,
    alerts: 999999,
    aiQueriesPerDay: 300,
    historicalDataDays: 90,
    heatmapAccess: true,
    multiExpiryAccess: true,
    telegramAlerts: true,
    strategyAI: true,
    dailyBrief: true,
    byoOpenAIKey: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.FREE;
}
