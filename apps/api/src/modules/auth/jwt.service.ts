import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SignJWT,
  jwtVerify,
  generateKeyPair,
  importPKCS8,
  importSPKI,
} from 'jose';
import type { CryptoKey } from 'jose';

export interface JwtPayload {
  sub: string;
  email: string;
  plan: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService implements OnModuleInit {
  private privateKey!: CryptoKey;
  private publicKey!: CryptoKey;
  private readonly logger = new Logger(JwtService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const privateKeyPem = this.configService.get<string>('JWT_PRIVATE_KEY');
    const publicKeyPem = this.configService.get<string>('JWT_PUBLIC_KEY');

    if (privateKeyPem && publicKeyPem) {
      this.privateKey = await importPKCS8(privateKeyPem, 'RS256');
      this.publicKey = await importSPKI(publicKeyPem, 'RS256');
    } else {
      this.logger.warn(
        'JWT keys not found in env — generating ephemeral keys. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY for production.',
      );
      const keys = await generateKeyPair('RS256');
      this.privateKey = keys.privateKey;
      this.publicKey = keys.publicKey;
    }
  }

  async signAccessToken(payload: {
    sub: string;
    email: string;
    plan: string;
  }): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('optionkart')
      .sign(this.privateKey);
  }

  async signRefreshToken(payload: { sub: string }): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setIssuer('optionkart')
      .sign(this.privateKey);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, this.publicKey, {
      issuer: 'optionkart',
      algorithms: ['RS256'],
    });
    return payload as unknown as JwtPayload;
  }
}
