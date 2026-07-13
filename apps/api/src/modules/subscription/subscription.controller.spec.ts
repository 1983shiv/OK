import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      createSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [{ provide: SubscriptionService, useValue: service }],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
  });

  describe('create', () => {
    it('delegates to service.createSubscription', async () => {
      const mockResult = {
        subscriptionId: 'sub_123',
        razorpayKeyId: 'key',
        prefill: {},
      };
      service.createSubscription.mockResolvedValue(mockResult);

      const result = await controller.create(
        { sub: 'user-1', email: 'a@b.com', plan: 'FREE' },
        { planId: 'starter', billingCycle: 'monthly' },
      );
      expect(result).toEqual(mockResult);
      expect(service.createSubscription).toHaveBeenCalledWith(
        'user-1',
        'starter',
        'monthly',
      );
    });
  });

  describe('cancel', () => {
    it('delegates to service.cancelSubscription', async () => {
      const mockResult = { status: 'CANCELLED' };
      service.cancelSubscription.mockResolvedValue(mockResult);

      const result = await controller.cancel({
        sub: 'user-1',
        email: 'a@b.com',
        plan: 'FREE',
      });
      expect(result).toEqual(mockResult);
      expect(service.cancelSubscription).toHaveBeenCalledWith('user-1');
    });
  });

  describe('webhook', () => {
    it('delegates to service.handleWebhook', async () => {
      const mockResult = { received: true, duplicate: false };
      service.handleWebhook.mockResolvedValue(mockResult);

      const req = { body: { event: 'test' } } as any;
      const result = await controller.webhook(req, 'test-sig');
      expect(result).toEqual(mockResult);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        '{"event":"test"}',
        'test-sig',
      );
    });

    it('throws when signature header is missing', async () => {
      const req = { body: {} } as any;
      await expect(controller.webhook(req, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
