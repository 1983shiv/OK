import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import cookieParser from 'cookie-parser';

jest.mock('jose', () => {
  const mockSignJWT = jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-token'),
  }));
  return {
    SignJWT: mockSignJWT,
    jwtVerify: jest.fn().mockResolvedValue({
      payload: { sub: 'u1', email: 't@t.com', plan: 'FREE' },
    }),
    generateKeyPair: jest.fn().mockResolvedValue({
      privateKey: {},
      publicKey: {},
    }),
    importPKCS8: jest.fn().mockResolvedValue({}),
    importSPKI: jest.fn().mockResolvedValue({}),
  };
});

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /v1/health returns 200 with service status', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toMatch(/^ok$|^degraded$/);
          expect(res.body.data.services).toHaveProperty('postgres');
          expect(res.body.data.services).toHaveProperty('redis');
          expect(res.body.data.services).toHaveProperty('mongodb');
        });
    });
  });

  describe('Auth', () => {
    it('POST /v1/auth/magic-link returns 200 for any email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/magic-link')
        .send({ email: 'test@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toContain('has been sent');
        });
    });

    it('POST /v1/auth/refresh returns 401 without cookie', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toBe('No refresh token');
        });
    });

    it('POST /v1/auth/magic-link rejects invalid email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/magic-link')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('User', () => {
    it('GET /v1/user/profile returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/v1/user/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toContain('Missing');
        });
    });
  });

  describe('Market (public)', () => {
    it.each(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'])(
      'GET /v1/market/dashboard/%s returns dashboard data',
      (index) =>
        request(app.getHttpServer())
          .get(`/v1/market/dashboard/${index}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.index).toBe(index);
            expect(res.body.data.spotPrice).toBeGreaterThan(0);
            expect(res.body.data.pcr).toBeGreaterThan(0);
            expect(res.body.data.maxPain).toBeGreaterThan(0);
            expect(res.body.data.totalCallOI).toBeGreaterThan(0);
            expect(res.body.data.totalPutOI).toBeGreaterThan(0);
            expect(res.body.data.topCallBuildup.length).toBe(5);
          }),
    );

    it('GET /v1/market/chain/NIFTY returns option chain', () =>
      request(app.getHttpServer())
        .get('/v1/market/chain/NIFTY')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.chain.length).toBeGreaterThan(10);
          expect(res.body.data.chain[0]).toHaveProperty('strikePrice');
          expect(res.body.data.chain[0]).toHaveProperty('callOI');
          expect(res.body.data.chain[0]).toHaveProperty('putOI');
          expect(res.body.data.chain[0]).toHaveProperty('callIV');
        }));

    it('GET /v1/market/spot/NIFTY returns spot price', () =>
      request(app.getHttpServer())
        .get('/v1/market/spot/NIFTY')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.price).toBeGreaterThan(0);
          expect(res.body.data).toHaveProperty('fetchedAt');
        }));

    it('GET /v1/market/pcr/NIFTY returns PCR', () =>
      request(app.getHttpServer())
        .get('/v1/market/pcr/NIFTY')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.pcr).toBeGreaterThan(0);
          expect(['RISING', 'FALLING', 'NEUTRAL']).toContain(
            res.body.data.pcrTrend,
          );
        }));

    it('GET /v1/market/max-pain/NIFTY returns max pain', () =>
      request(app.getHttpServer())
        .get('/v1/market/max-pain/NIFTY')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.maxPain).toBeGreaterThan(0);
        }));

    it('GET /v1/market/support-resistance/NIFTY returns levels', () =>
      request(app.getHttpServer())
        .get('/v1/market/support-resistance/NIFTY')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('support');
          expect(res.body.data).toHaveProperty('resistance');
          expect(res.body.data).toHaveProperty('spotPrice');
        }));
  });

  describe('Market (plan-gated)', () => {
    it('GET /v1/market/pcr/NIFTY/history returns 401 without auth', () =>
      request(app.getHttpServer())
        .get('/v1/market/pcr/NIFTY/history')
        .expect(401));

    it('GET /v1/market/heatmap/NIFTY returns 401 without auth', () =>
      request(app.getHttpServer()).get('/v1/market/heatmap/NIFTY').expect(401));

    it('GET /v1/market/oi-history/NIFTY returns 401 without auth', () =>
      request(app.getHttpServer())
        .get('/v1/market/oi-history/NIFTY')
        .expect(401));

    it('GET /v1/market/unusual-activity/NIFTY returns 401 without auth', () =>
      request(app.getHttpServer())
        .get('/v1/market/unusual-activity/NIFTY')
        .expect(401));
  });

  describe('Watchlist', () => {
    it('GET /v1/watchlist returns 401 without auth', () =>
      request(app.getHttpServer()).get('/v1/watchlist').expect(401));

    it('POST /v1/watchlist returns 401 without auth', () =>
      request(app.getHttpServer()).post('/v1/watchlist').send({}).expect(401));
  });

  describe('Alerts', () => {
    it('GET /v1/alerts returns 401 without auth', () =>
      request(app.getHttpServer()).get('/v1/alerts').expect(401));

    it('POST /v1/alerts returns 401 without auth', () =>
      request(app.getHttpServer()).post('/v1/alerts').send({}).expect(401));

    it('GET /v1/alerts/history returns 401 without auth', () =>
      request(app.getHttpServer()).get('/v1/alerts/history').expect(401));
  });

  describe('Notifications', () => {
    it('GET /v1/notifications returns 401 without auth', () =>
      request(app.getHttpServer()).get('/v1/notifications').expect(401));

    it('GET /v1/notifications/unread-count returns 401 without auth', () =>
      request(app.getHttpServer())
        .get('/v1/notifications/unread-count')
        .expect(401));
  });

  describe('404', () => {
    it('returns envelope for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/v1/nonexistent')
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toHaveProperty('code', 404);
          expect(res.body.error).toHaveProperty('path');
          expect(res.body.error).toHaveProperty('timestamp');
        });
    });
  });
});
