import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

jest.mock('jose', () => ({
  SignJWT: jest.fn(),
  jwtVerify: jest.fn(),
  generateKeyPair: jest.fn(),
  importPKCS8: jest.fn(),
  importSPKI: jest.fn(),
}));

type MockFn = jest.Mock & { mockResolvedValue: (v: unknown) => jest.Mock };

function mockObj(keys: string[]): Record<string, MockFn> {
  const obj: Record<string, MockFn> = {};
  for (const k of keys) obj[k] = jest.fn() as unknown as MockFn;
  return obj;
}

describe('AuthService', () => {
  let service: AuthService;
  let prismaUser: Record<string, jest.Mock>;
  let prismaToken: Record<string, jest.Mock>;
  let jwt: JwtService;

  const mockUser = { id: 'user-1', email: 'test@example.com', plan: 'FREE' };

  beforeEach(async () => {
    prismaUser = mockObj(['findUnique', 'findFirst', 'create', 'update']);
    prismaToken = mockObj(['findUnique', 'create', 'update']);

    const mockPrisma = {
      client: { user: prismaUser, magicLinkToken: prismaToken },
    };

    jwt = {
      signAccessToken: jest.fn().mockResolvedValue('access-token'),
      signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
      verifyToken: jest.fn(),
      onModuleInit: jest.fn(),
    } as any;

    const mockConfig = {
      get: jest.fn((k: string) =>
        k === 'FRONTEND_URL' ? 'http://localhost:3000' : undefined,
      ),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestMagicLink', () => {
    it('creates a new user and returns message', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaUser.create as jest.Mock).mockResolvedValue(mockUser);
      (prismaToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.requestMagicLink('Test@Example.com');

      expect(prismaUser.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', authProvider: 'EMAIL' },
      });
      expect(result.message).toContain('has been sent');
    });

    it('reuses existing user', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaToken.create as jest.Mock).mockResolvedValue({});

      await service.requestMagicLink('test@example.com');
      expect(prismaUser.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyMagicLink', () => {
    const rawToken = 'uuid-token';

    it('returns tokens for valid token', async () => {
      (prismaToken.findUnique as jest.Mock).mockResolvedValue({
        id: 't1',
        tokenHash: 'hash',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
        user: mockUser,
      });
      (prismaToken.update as jest.Mock).mockResolvedValue({});

      const result = await service.verifyMagicLink(rawToken);

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws for invalid token', async () => {
      (prismaToken.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.verifyMagicLink('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws for used token', async () => {
      (prismaToken.findUnique as jest.Mock).mockResolvedValue({
        id: 't1',
        tokenHash: 'hash',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
        user: mockUser,
      });
      await expect(service.verifyMagicLink(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws for expired token', async () => {
      (prismaToken.findUnique as jest.Mock).mockResolvedValue({
        id: 't1',
        tokenHash: 'hash',
        userId: 'u1',
        expiresAt: new Date(Date.now() - 60000),
        usedAt: null,
        user: mockUser,
      });
      await expect(service.verifyMagicLink(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshUserTokens', () => {
    it('returns new tokens for valid user', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.refreshUserTokens('user-1');
      expect(result.accessToken).toBe('access-token');
    });

    it('throws for non-existent user', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.refreshUserTokens('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
