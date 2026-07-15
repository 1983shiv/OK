import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

@Injectable()
export class UpstoxService {
  private readonly logger = new Logger(UpstoxService.name);
  private accessToken: string | null = null;

  private consecutiveFailures = 0;
  private circuitOpenUntil: number | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.configService.get('UPSTOX_CLIENT_ID') &&
      this.configService.get('UPSTOX_CLIENT_SECRET')
    );
  }

  private isCircuitBroken(): boolean {
    if (this.circuitOpenUntil === null) return false;
    if (Date.now() > this.circuitOpenUntil) {
      this.circuitOpenUntil = null;
      this.consecutiveFailures = 0;
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = null;
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_RESET_MS;
      this.logger.warn(
        `Circuit breaker opened after ${this.consecutiveFailures} consecutive failures`,
      );
    }
  }

  async authenticate(): Promise<string | null> {
    if (!this.isConfigured()) return null;
    if (this.isCircuitBroken()) {
      this.logger.warn('Circuit breaker open — skipping Upstox auth');
      return null;
    }
    if (this.accessToken) return this.accessToken;

    try {
      const response = await fetch(
        'https://api.upstox.com/v2/login/authorization/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            client_id: this.configService.getOrThrow('UPSTOX_CLIENT_ID'),
            client_secret: this.configService.getOrThrow(
              'UPSTOX_CLIENT_SECRET',
            ),
            grant_type: 'client_credentials',
          }).toString(),
        },
      );

      if (!response.ok) {
        this.logger.error(`Upstox auth failed: ${response.status}`);
        this.recordFailure();
        return null;
      }

      this.recordSuccess();
      const data = (await response.json()) as { access_token: string };
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (err) {
      this.logger.error('Upstox auth error', err);
      this.recordFailure();
      return null;
    }
  }

  async fetchSpotPrice(instrumentKey: string): Promise<number | null> {
    if (!this.isConfigured()) return null;
    if (this.isCircuitBroken()) {
      this.logger.warn('Circuit breaker open — skipping Upstox spot fetch');
      return null;
    }

    try {
      const token = await this.authenticate();
      if (!token) return null;

      const response = await fetch(
        `https://api.upstox.com/v2/market/quote/${instrumentKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        this.recordFailure();
        return null;
      }

      this.recordSuccess();
      const data = (await response.json()) as {
        data: { [key: string]: { last_price: number } };
      };
      const quote = Object.values(data.data ?? {})[0];
      return quote?.last_price ?? null;
    } catch (err) {
      this.logger.error('Upstox spot fetch error', err);
      this.recordFailure();
      return null;
    }
  }
}
