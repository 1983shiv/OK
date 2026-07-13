import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

var mockRzpSubs: { create: jest.Mock; cancel: jest.Mock };
var mockRzpValidate: jest.Mock;
function createMockRzp() {
  mockRzpSubs = { create: jest.fn(), cancel: jest.fn() };
  mockRzpValidate = jest.fn().mockReturnValue(true);
  const ctor: any = jest.fn(() => ({ subscriptions: mockRzpSubs }));
  ctor.validateWebhookSignature = mockRzpValidate;
  return ctor;
}
jest.mock('razorpay', () => createMockRzp());

type MockFn = jest.Mock;

function mockObj<T extends string>(keys: T[]): { [K in T]: MockFn } {
  const obj = {} as { [K in T]: MockFn };
  for (const k of keys) obj[k] = jest.fn();
  return obj;
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prismaSub: {
    findUnique: MockFn;
    findFirst: MockFn;
    create: MockFn;
    update: MockFn;
  };
  let prismaUser: { findUnique: MockFn; update: MockFn };
  let prismaPayment: { create: MockFn };
  let prismaWebhookEvent: {
    findUnique: MockFn;
    create: MockFn;
    update: MockFn;
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test',
    plan: 'FREE',
  };
  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'STARTER',
    status: 'ACTIVE',
    razorpaySubscriptionId: 'sub_mock_123',
    razorpayPlanId: 'plan_starter_monthly',
    billingCycle: 'monthly',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(),
    trialEndsAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function buildModule(configMap: Record<string, string | undefined>) {
    prismaSub = mockObj(['findUnique', 'findFirst', 'create', 'update']);
    prismaUser = mockObj(['findUnique', 'update']);
    prismaPayment = mockObj(['create']);
    prismaWebhookEvent = mockObj(['findUnique', 'create', 'update']);

    return Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              subscription: prismaSub,
              user: prismaUser,
              payment: prismaPayment,
              webhookEvent: prismaWebhookEvent,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((k: string) => configMap[k] ?? undefined) },
        },
      ],
    }).compile();
  }

  // ─── Mock mode (no Razorpay keys) ────────────────────────────────────────

  describe('mock mode (no Razorpay keys)', () => {
    beforeEach(async () => {
      const module = await buildModule({});
      service = module.get<SubscriptionService>(SubscriptionService);
    });

    describe('isConfigured', () => {
      it('returns false', () => expect(service.isConfigured()).toBe(false));
    });

    describe('createSubscription', () => {
      it('creates subscription with mock data', async () => {
        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue(null);
        prismaSub.create.mockResolvedValue(mockSubscription);
        const result = await service.createSubscription(
          'user-1',
          'starter',
          'monthly',
        );
        expect(result.subscriptionId).toMatch(/^(mock_sub_|sub_mock_)/);
        expect(result.prefill.email).toBe('test@test.com');
      });

      it('throws when user not found', async () => {
        prismaUser.findUnique.mockResolvedValue(null);
        await expect(
          service.createSubscription('user-1', 'starter', 'monthly'),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws when user has active subscription', async () => {
        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue({
          ...mockSubscription,
          status: 'ACTIVE',
        });
        await expect(
          service.createSubscription('user-1', 'pro', 'monthly'),
        ).rejects.toThrow('already has an active subscription');
      });

      it('throws for invalid plan', async () => {
        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue(null);
        await expect(
          service.createSubscription(
            'user-1',
            'invalid' as any,
            'monthly' as any,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('allows existing non-active subscription', async () => {
        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue({
          ...mockSubscription,
          status: 'EXPIRED',
        });
        prismaSub.create.mockResolvedValue(mockSubscription);
        const result = await service.createSubscription(
          'user-1',
          'starter',
          'monthly',
        );
        expect(result.subscriptionId).toBeDefined();
      });
    });

    describe('cancelSubscription', () => {
      it('cancels active subscription', async () => {
        prismaSub.findUnique.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue({
          ...mockSubscription,
          status: 'CANCELLED',
          cancelledAt: new Date(),
        });
        const result = await service.cancelSubscription('user-1');
        expect(result.status).toBe('CANCELLED');
        expect(result.cancelledAt).toBeDefined();
      });

      it('throws when no subscription found', async () => {
        prismaSub.findUnique.mockResolvedValue(null);
        await expect(service.cancelSubscription('user-1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws when already cancelled', async () => {
        prismaSub.findUnique.mockResolvedValue({
          ...mockSubscription,
          status: 'CANCELLED',
        });
        await expect(service.cancelSubscription('user-1')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('handleWebhook', () => {
      it('processes subscription.activated (no webhook secret — skips validation)', async () => {
        const payload = {
          event_id: 'evt_act',
          event: 'subscription.activated',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue(mockSubscription);
        prismaUser.update.mockResolvedValue(mockUser);
        prismaPayment.create.mockResolvedValue({});

        const result = await service.handleWebhook(
          JSON.stringify(payload),
          'sig',
        );
        expect(result.received).toBe(true);
        expect(result.duplicate).toBe(false);
      });

      it('rejects duplicate events', async () => {
        const payload = {
          event_id: 'evt_dup',
          event: 'subscription.activated',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue({
          id: 'existing',
          eventId: 'evt_dup',
        });
        const result = await service.handleWebhook(
          JSON.stringify(payload),
          'sig',
        );
        expect(result.duplicate).toBe(true);
      });

      it('throws on invalid JSON', async () => {
        await expect(service.handleWebhook('not-json', 'sig')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('throws on missing event_id', async () => {
        await expect(
          service.handleWebhook(JSON.stringify({}), 'sig'),
        ).rejects.toThrow('Missing event_id');
      });
    });
  });

  // ─── Razorpay configured mode ────────────────────────────────────────────

  describe('Razorpay configured mode', () => {
    beforeEach(async () => {
      mockRzpSubs.create.mockReset();
      mockRzpSubs.cancel.mockReset();
      const module = await buildModule({
        RAZORPAY_KEY_ID: 'rzp_test_key',
        RAZORPAY_KEY_SECRET: 'test_secret',
        RAZORPAY_WEBHOOK_SECRET: 'whsec_test',
      });
      service = module.get<SubscriptionService>(SubscriptionService);
    });

    describe('isConfigured', () => {
      it('returns true', () => expect(service.isConfigured()).toBe(true));
    });

    describe('createSubscription', () => {
      it('calls Razorpay SDK and creates subscription', async () => {
        mockRzpSubs.create.mockResolvedValue({ id: 'sub_rzp_abc123' });

        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue(null);
        prismaSub.create.mockResolvedValue({
          ...mockSubscription,
          razorpaySubscriptionId: 'sub_rzp_abc123',
          status: 'CREATED',
        });

        const result = await service.createSubscription(
          'user-1',
          'pro',
          'yearly',
        );
        expect(result.subscriptionId).toBe('sub_rzp_abc123');
      });

      it('fails when Razorpay SDK throws', async () => {
        mockRzpSubs.create.mockRejectedValue(new Error('Razorpay error'));

        prismaUser.findUnique.mockResolvedValue(mockUser);
        prismaSub.findUnique.mockResolvedValue(null);

        await expect(
          service.createSubscription('user-1', 'starter', 'monthly'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('cancelSubscription', () => {
      it('calls Razorpay SDK cancel when subscription starts with sub_', async () => {
        prismaSub.findUnique.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue({
          ...mockSubscription,
          status: 'CANCELLED',
          cancelledAt: new Date(),
        });

        const result = await service.cancelSubscription('user-1');
        expect(result.status).toBe('CANCELLED');
        expect(mockRzpSubs.cancel).toHaveBeenCalledWith('sub_mock_123');
      });

      it('gracefully handles Razorpay SDK cancel failure', async () => {
        mockRzpSubs.cancel.mockRejectedValue(new Error('Razorpay error'));

        prismaSub.findUnique.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue({
          ...mockSubscription,
          status: 'CANCELLED',
          cancelledAt: new Date(),
        });

        const result = await service.cancelSubscription('user-1');
        expect(result.status).toBe('CANCELLED');
      });
    });

    describe('handleWebhook', () => {
      beforeEach(() => {
        mockRzpSubs.create.mockReset();
        mockRzpValidate.mockReturnValue(true);
      });

      it('validates signature when webhook secret is set', async () => {
        const payload = {
          event_id: 'evt_sig',
          event: 'subscription.charged',
          payload: {
            subscription: { id: 'sub_mock_123' },
            payment: {
              id: 'pay_456',
              amount: 49900,
              currency: 'INR',
              status: 'captured',
            },
          },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue(mockSubscription);
        prismaUser.update.mockResolvedValue(mockUser);
        prismaPayment.create.mockResolvedValue({});

        const result = await service.handleWebhook(
          JSON.stringify(payload),
          'valid-sig',
        );
        expect(result.received).toBe(true);
      });

      it('rejects invalid signature', async () => {
        mockRzpValidate.mockReturnValue(false);

        await expect(
          service.handleWebhook(
            JSON.stringify({ event_id: 'evt_bad' }),
            'bad-sig',
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('processes subscription.halted — sets status to EXPIRED', async () => {
        const payload = {
          event_id: 'evt_halt',
          event: 'subscription.halted',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue({
          ...mockSubscription,
          status: 'EXPIRED',
        });

        await service.handleWebhook(JSON.stringify(payload), 'sig');
        expect(prismaSub.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { status: 'EXPIRED' } }),
        );
      });

      it('processes subscription.cancelled — sets status to CANCELLED', async () => {
        const payload = {
          event_id: 'evt_cancel',
          event: 'subscription.cancelled',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue({
          ...mockSubscription,
          status: 'CANCELLED',
        });

        await service.handleWebhook(JSON.stringify(payload), 'sig');
        expect(prismaSub.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { status: 'CANCELLED' } }),
        );
      });

      it('processes payment.failed — logs warning without crash', async () => {
        const payload = {
          event_id: 'evt_fail',
          event: 'payment.failed',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);

        const result = await service.handleWebhook(
          JSON.stringify(payload),
          'sig',
        );
        expect(result.received).toBe(true);
      });

      it('ignores unknown subscription ID', async () => {
        const payload = {
          event_id: 'evt_unk',
          event: 'subscription.activated',
          payload: { subscription: { id: 'sub_unknown' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(null);

        const result = await service.handleWebhook(
          JSON.stringify(payload),
          'sig',
        );
        expect(result.received).toBe(true);
      });

      it('creates payment record on subscription.charged with payment data', async () => {
        const payload = {
          event_id: 'evt_pay',
          event: 'subscription.charged',
          payload: {
            subscription: { id: 'sub_mock_123' },
            payment: {
              id: 'pay_999',
              amount: 19900,
              currency: 'INR',
              status: 'captured',
              order_id: 'ord_1',
              invoice_id: 'inv_1',
            },
          },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue(mockSubscription);
        prismaUser.update.mockResolvedValue(mockUser);
        prismaPayment.create.mockResolvedValue({});

        await service.handleWebhook(JSON.stringify(payload), 'sig');
        expect(prismaPayment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              razorpayPaymentId: 'pay_999',
              amount: 19900,
            }),
          }),
        );
      });

      it('skips payment record when payment data missing', async () => {
        const payload = {
          event_id: 'evt_nopay',
          event: 'subscription.charged',
          payload: { subscription: { id: 'sub_mock_123' } },
        };
        prismaWebhookEvent.findUnique.mockResolvedValue(null);
        prismaWebhookEvent.create.mockResolvedValue({});
        prismaWebhookEvent.update.mockResolvedValue({});
        prismaSub.findFirst.mockResolvedValue(mockSubscription);
        prismaSub.update.mockResolvedValue(mockSubscription);
        prismaUser.update.mockResolvedValue(mockUser);

        await service.handleWebhook(JSON.stringify(payload), 'sig');
        expect(prismaPayment.create).not.toHaveBeenCalled();
      });
    });
  });
});
