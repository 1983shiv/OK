// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Plan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ELITE = 'ELITE',
}

export enum OptionType {
  CALL = 'CE',
  PUT = 'PE',
}

export enum MarketStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  HOLIDAY = 'HOLIDAY',
}

export enum AlertType {
  OI_SPIKE = 'OI_SPIKE',
  PCR_CROSS = 'PCR_CROSS',
  MAX_PAIN_SHIFT = 'MAX_PAIN_SHIFT',
  WATCHLIST = 'WATCHLIST',
}

export enum ConditionOperator {
  GREATER_THAN = 'GT',
  LESS_THAN = 'LT',
  CROSSES_ABOVE = 'CROSS_ABOVE',
  CROSSES_BELOW = 'CROSS_BELOW',
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  authProvider: 'EMAIL' | 'GOOGLE';
  createdAt: string;
}

// ─── Market Data ──────────────────────────────────────────────────────────────

export interface OptionStrike {
  strikePrice: number;
  expiryDate: string;
  callOI: number;
  callOIChange: number;
  callLTP: number;
  callVolume: number;
  putOI: number;
  putOIChange: number;
  putLTP: number;
  putVolume: number;
  callIV: number;
  putIV: number;
  isATM: boolean;
}

export interface OptionsChain {
  index: string;
  spotPrice: number;
  expiryDate: string;
  availableExpiries: string[];
  strikes: OptionStrike[];
  fetchedAt: string;
}

export interface DashboardData {
  index: string;
  spotPrice: number;
  pcr: number;
  pcrTrend: 'RISING' | 'FALLING' | 'NEUTRAL';
  maxPain: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // -100 to +100
  totalCallOI: number;
  totalPutOI: number;
  callOIChange: number;
  putOIChange: number;
  topCallBuildup: OptionStrike[];
  topPutBuildup: OptionStrike[];
  marketStatus: MarketStatus;
  nextOpenAt: string | null;
  isStale: boolean;
  staleAgeSeconds: number;
  fetchedAt: string;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  userId: string;
  instrumentKey: string;
  symbol: string;
  strikePrice: number;
  optionType: OptionType;
  expiryDate: string;
  createdAt: string;
  // enriched live data (hydrated at serve time)
  currentOI?: number;
  oiChange?: number;
  currentLTP?: number;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  userId: string;
  alertType: AlertType;
  symbol: string;
  strikePrice: number | null;
  conditionOperator: ConditionOperator;
  conditionValue: number;
  deliveryChannels: ('IN_APP' | 'EMAIL' | 'PUSH' | 'TELEGRAM')[];
  isActive: boolean;
  createdAt: string;
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export interface PlanLimits {
  watchlistItems: number;
  alerts: number;
  aiQueriesPerDay: number;
  historicalDataDays: number;
  heatmapAccess: boolean;
  multiExpiryAccess: boolean;
  telegramAlerts: boolean;
  strategyAI: boolean;
  dailyBrief: boolean;
  byoOpenAIKey: boolean;
}
