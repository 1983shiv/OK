import type { OptionStrike } from '@optionkart/types';

// ─── PCR (Put-Call Ratio) ────────────────────────────────────────────────────

/**
 * Calculates Put-Call Ratio from the options chain.
 * PCR = Total Put OI / Total Call OI
 * > 1.2  → Bullish (more put writers = market expects upside)
 * < 0.8  → Bearish
 * 0.8–1.2 → Neutral
 */
export function calculatePCR(strikes: OptionStrike[]): number {
  const totalCallOI = strikes.reduce((sum, s) => sum + s.callOI, 0);
  const totalPutOI = strikes.reduce((sum, s) => sum + s.putOI, 0);
  if (totalCallOI === 0) return 0;
  return parseFloat((totalPutOI / totalCallOI).toFixed(4));
}

// ─── Max Pain ─────────────────────────────────────────────────────────────────

/**
 * Calculates Max Pain strike — the strike where option writers (sellers)
 * face the least aggregate payout at expiry.
 * For each candidate strike, sum the ITM payout for all calls and puts.
 */
export function calculateMaxPain(strikes: OptionStrike[]): number {
  if (strikes.length === 0) return 0;

  let minPain = Infinity;
  let maxPainStrike = strikes[0]!.strikePrice;

  for (const candidate of strikes) {
    const s = candidate.strikePrice;
    let totalPain = 0;

    for (const strike of strikes) {
      const k = strike.strikePrice;
      // Call writers pay max(S - K, 0) * callOI for each strike K
      totalPain += Math.max(s - k, 0) * strike.callOI;
      // Put writers pay max(K - S, 0) * putOI for each strike K
      totalPain += Math.max(k - s, 0) * strike.putOI;
    }

    if (totalPain < minPain) {
      minPain = totalPain;
      maxPainStrike = s;
    }
  }

  return maxPainStrike;
}

// ─── Sentiment ───────────────────────────────────────────────────────────────

/**
 * Derives a composite market sentiment score (-100 to +100).
 * Positive = Bullish, Negative = Bearish.
 *
 * Factors:
 *   40% PCR component  (PCR > 1.2 = bullish, < 0.8 = bearish)
 *   30% Call OI change (falling calls = bullish)
 *   30% Put OI change  (rising puts = bullish — put writers are confident)
 */
export function calculateSentiment(
  pcr: number,
  callOIChange: number,
  putOIChange: number,
): { score: number; label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  // Normalize PCR to -100..+100
  // PCR=1.2 → +100 (bullish), PCR=0.8 → -100 (bearish), PCR=1.0 → 0
  const pcrScore = Math.max(-100, Math.min(100, (pcr - 1.0) * 250));

  // Falling call OI = call shorts closing = bullish (positive score)
  const callScore = callOIChange < 0 ? 50 : callOIChange > 0 ? -50 : 0;

  // Rising put OI = put writers = bullish (positive score)
  const putScore = putOIChange > 0 ? 50 : putOIChange < 0 ? -50 : 0;

  const composite = pcrScore * 0.4 + callScore * 0.3 + putScore * 0.3;
  const score = Math.round(Math.max(-100, Math.min(100, composite)));

  let label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (score >= 20) label = 'BULLISH';
  else if (score <= -20) label = 'BEARISH';
  else label = 'NEUTRAL';

  return { score, label };
}

// ─── ATM Strike ───────────────────────────────────────────────────────────────

/**
 * Finds the At-The-Money strike closest to the current spot price.
 */
export function getATMStrike(strikes: OptionStrike[], spotPrice: number): OptionStrike | null {
  if (strikes.length === 0) return null;
  return strikes.reduce((closest, current) =>
    Math.abs(current.strikePrice - spotPrice) < Math.abs(closest.strikePrice - spotPrice)
      ? current
      : closest,
  );
}

// ─── Market Hours ─────────────────────────────────────────────────────────────

// NSE market hours: 09:15 – 15:30 IST, Mon–Fri (excluding public holidays)
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 15;
const MARKET_CLOSE_HOUR = 15;
const MARKET_CLOSE_MINUTE = 30;

// NSE public holidays 2025 (add each year)
const NSE_HOLIDAYS_2025 = new Set([
  '2025-01-26', // Republic Day
  '2025-02-26', // Maha Shivratri
  '2025-03-14', // Holi
  '2025-04-14', // Dr. Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-08-15', // Independence Day
  '2025-08-27', // Ganesh Chaturthi
  '2025-10-02', // Gandhi Jayanti
  '2025-10-02', // Dussehra
  '2025-10-24', // Diwali Laxmi Puja
  '2025-10-25', // Diwali Balipratipada
  '2025-11-05', // Gurunanak Jayanti
  '2025-12-25', // Christmas
]);

const NSE_HOLIDAYS_2026 = new Set([
  '2026-01-26', // Republic Day
  '2026-03-20', // Holi
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-08-15', // Independence Day
  '2026-08-19', // Ganesh Chaturthi
  '2026-10-02', // Gandhi Jayanti
  '2026-11-13', // Diwali
  '2026-12-25', // Christmas
]);

export function isMarketOpen(now: Date): boolean {
  // Convert to IST (UTC+5:30)
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const dayOfWeek = ist.getDay(); // 0=Sun, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const dateStr = ist.toISOString().slice(0, 10);
  if (NSE_HOLIDAYS_2025.has(dateStr) || NSE_HOLIDAYS_2026.has(dateStr)) return false;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

/**
 * Returns the next market open datetime (IST) as a UTC Date object.
 * Used for displaying "Market opens in X hours" in the UI.
 */
export function getNextMarketOpen(now: Date): Date {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const candidate = new Date(ist);
  candidate.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  // If we're past today's open time, move to tomorrow
  if (ist >= candidate) {
    candidate.setDate(candidate.getDate() + 1);
  }

  // Skip weekends and holidays
  while (
    candidate.getDay() === 0 ||
    candidate.getDay() === 6 ||
    NSE_HOLIDAYS_2025.has(candidate.toISOString().slice(0, 10)) ||
    NSE_HOLIDAYS_2026.has(candidate.toISOString().slice(0, 10))
  ) {
    candidate.setDate(candidate.getDate() + 1);
  }

  // Convert back to UTC (IST is UTC+5:30)
  return new Date(candidate.getTime() - 5.5 * 60 * 60 * 1000);
}
