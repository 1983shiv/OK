import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UpstoxService {
  private readonly logger = new Logger(UpstoxService.name);
  private accessToken: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.configService.get('UPSTOX_CLIENT_ID') &&
      this.configService.get('UPSTOX_CLIENT_SECRET')
    );
  }

  async authenticate(): Promise<string | null> {
    if (!this.isConfigured()) return null;
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
        return null;
      }

      const data = (await response.json()) as { access_token: string };
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (err) {
      this.logger.error('Upstox auth error', err);
      return null;
    }
  }

  async fetchSpotPrice(instrumentKey: string): Promise<number | null> {
    if (!this.isConfigured()) return null;

    try {
      const token = await this.authenticate();
      if (!token) return null;

      const response = await fetch(
        `https://api.upstox.com/v2/market/quote/${instrumentKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return null;

      const data = (await response.json()) as {
        data: { [key: string]: { last_price: number } };
      };
      const quote = Object.values(data.data ?? {})[0];
      return quote?.last_price ?? null;
    } catch (err) {
      this.logger.error('Upstox spot fetch error', err);
      return null;
    }
  }
}
