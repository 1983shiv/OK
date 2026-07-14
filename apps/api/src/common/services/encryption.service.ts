import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private key: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    if (keyHex) {
      this.key = Buffer.from(keyHex, 'hex');
      if (this.key.length !== 32) {
        this.logger.warn(
          `ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${this.key.length} bytes`,
        );
        this.key = null;
      }
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  encrypt(plaintext: string): string {
    if (!this.key) return plaintext;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.key) return ciphertext;
    if (!ciphertext.includes(':')) return ciphertext;

    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const iv = Buffer.from(parts[0]!, 'hex');
    const tag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts[2]!;

    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      this.logger.error('Decryption failed');
      return ciphertext;
    }
  }
}
