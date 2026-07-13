import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestMagicLink(email: string): Promise<{ message: string }> {
    const lowerEmail = email.toLowerCase();

    let user = await this.prismaService.client.user.findUnique({
      where: { email: lowerEmail },
    });
    if (!user) {
      user = await this.prismaService.client.user.create({
        data: { email: lowerEmail, authProvider: 'EMAIL' },
      });
    }

    const rawToken = randomUUID();
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.prismaService.client.magicLinkToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const magicLink = `${this.configService.get('FRONTEND_URL')}/auth/verify?token=${rawToken}`;
    this.logger.log(`Magic link for ${lowerEmail}: ${magicLink}`);

    return { message: 'If an account exists, a magic link has been sent.' };
  }

  async verifyMagicLink(rawToken: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prismaService.client.magicLinkToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token) throw new UnauthorizedException('Invalid or expired token');
    if (token.usedAt) throw new UnauthorizedException('Token already used');
    if (token.expiresAt < new Date())
      throw new UnauthorizedException('Token expired');

    await this.prismaService.client.magicLinkToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return this.generateTokens(token.user);
  }

  async googleAuth(code: string, redirectUri?: string) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Google OAuth not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri:
          redirectUri ??
          `${this.configService.get('FRONTEND_URL')}/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Google auth code');
    }

    const { access_token } = (await tokenResponse.json()) as {
      access_token: string;
    };

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException('Failed to fetch Google user info');
    }

    const googleUser = (await userInfoResponse.json()) as {
      id: string;
      email: string;
      name: string;
    };

    const lowerEmail = googleUser.email.toLowerCase();

    let user = await this.prismaService.client.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: lowerEmail }] },
    });

    if (user) {
      const updates: Record<string, string> = {};
      if (!user.googleId) updates.googleId = googleUser.id;
      if (user.authProvider !== 'GOOGLE') updates.authProvider = 'GOOGLE';
      if (Object.keys(updates).length > 0) {
        await this.prismaService.client.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      user = await this.prismaService.client.user.create({
        data: {
          email: lowerEmail,
          name: googleUser.name,
          googleId: googleUser.id,
          authProvider: 'GOOGLE',
        },
      });
    }

    return this.generateTokens(user);
  }

  async refreshUserTokens(userId: string) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.generateTokens(user);
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    plan: string;
  }) {
    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      plan: user.plan,
    });
    const refreshToken = await this.jwtService.signRefreshToken({
      sub: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, plan: user.plan },
    };
  }
}
