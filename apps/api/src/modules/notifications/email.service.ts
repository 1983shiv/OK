import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY') ?? null;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(
        `Email not sent — RESEND_API_KEY not configured. Would send to ${to}: ${subject}`,
      );
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OptionKart <notifications@optionkart.app>',
          to,
          subject,
          html: body,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Email send failed: ${response.status}`);
        return false;
      }

      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error('Email send error', err);
      return false;
    }
  }
}
