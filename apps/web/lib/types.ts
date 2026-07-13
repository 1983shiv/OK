export interface DashboardData {
  index: string;
  spotPrice: number;
  pcr: number;
  pcrTrend: 'RISING' | 'FALLING' | 'NEUTRAL';
  maxPain: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number;
  totalCallOI: number;
  totalPutOI: number;
  callOIChange: number;
  putOIChange: number;
  topCallBuildup: { strikePrice: number; callOIChange: number }[];
  topPutBuildup: { strikePrice: number; putOIChange: number }[];
  marketStatus: string;
  fetchedAt: string;
}

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
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
