import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('signed-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { sub: 'user-1', email: 'test@example.com', plan: 'FREE' },
  }),
  generateKeyPair: jest.fn().mockResolvedValue({
    privateKey: 'mock-private-key',
    publicKey: 'mock-public-key',
  }),
  importPKCS8: jest.fn().mockResolvedValue('mock-key'),
  importSPKI: jest.fn().mockResolvedValue('mock-key'),
}));

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    await service.onModuleInit();
  });

  it('signs access token', async () => {
    const token = await service.signAccessToken({
      sub: 'u1',
      email: 'a@b.com',
      plan: 'FREE',
    });
    expect(token).toBe('signed-token');
  });

  it('signs refresh token', async () => {
    const token = await service.signRefreshToken({ sub: 'u1' });
    expect(token).toBe('signed-token');
  });

  it('verifies token', async () => {
    const payload = await service.verifyToken('some-token');
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('test@example.com');
  });
});
