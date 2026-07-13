import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertEvaluator } from './alerts.evaluator';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prismaAlert: Record<string, jest.Mock>;
  let prismaAlertHistory: Record<string, jest.Mock>;
  let prismaUser: Record<string, jest.Mock>;
  let marketService: Record<string, jest.Mock>;

  const mockUser = { id: 'user-1', plan: 'FREE' };
  const mockAlert = {
    id: 'alert-1',
    userId: 'user-1',
    alertType: 'PCR_CROSS',
    symbol: 'NIFTY',
    strikePrice: null,
    optionType: null,
    conditionOperator: 'GT',
    conditionValue: 1.2,
    deliveryChannels: '["IN_APP"]',
    isActive: true,
    lastTriggeredAt: null,
    createdAt: new Date('2026-07-13'),
    updatedAt: new Date('2026-07-13'),
  };

  beforeEach(async () => {
    prismaAlert = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    prismaAlertHistory = {
      findMany: jest.fn(),
      create: jest.fn(),
    };

    prismaUser = {
      findUnique: jest.fn(),
    };

    marketService = {
      getDashboard: jest.fn().mockResolvedValue({
        pcr: 1.1,
        maxPain: 24100,
        totalCallOI: 5000000,
        totalPutOI: 5200000,
      }),
    };

    const mockPrisma = {
      client: {
        alert: prismaAlert,
        alertHistory: prismaAlertHistory,
        user: prismaUser,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        AlertEvaluator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MarketService, useValue: marketService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  describe('list', () => {
    it('returns all alerts for user', async () => {
      (prismaAlert.findMany as jest.Mock).mockResolvedValue([mockAlert]);
      const result = await service.list('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.symbol).toBe('NIFTY');
    });

    it('returns empty array', async () => {
      (prismaAlert.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.list('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createData = {
      alertType: 'PCR_CROSS',
      symbol: 'NIFTY',
      conditionOperator: 'GT',
      conditionValue: 1.2,
      deliveryChannels: ['IN_APP'] as string[],
    };

    it('creates alert within plan limits', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaAlert.count as jest.Mock).mockResolvedValue(1);
      (prismaAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await service.create('user-1', createData);
      expect(result.alertType).toBe('PCR_CROSS');
    });

    it('throws when at plan limit', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaAlert.count as jest.Mock).mockResolvedValue(3);

      await expect(service.create('user-1', createData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when user not found', async () => {
      (prismaUser.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.create('user-1', createData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates existing alert', async () => {
      (prismaAlert.findFirst as jest.Mock).mockResolvedValue(mockAlert);
      (prismaAlert.update as jest.Mock).mockResolvedValue({
        ...mockAlert,
        conditionValue: 1.5,
      });

      const result = await service.update('user-1', 'alert-1', {
        conditionValue: 1.5,
      });
      expect(result.conditionValue).toBe(1.5);
    });

    it('throws for non-existent alert', async () => {
      (prismaAlert.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        service.update('user-1', 'bad-id', { conditionValue: 1.5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes existing alert', async () => {
      (prismaAlert.findFirst as jest.Mock).mockResolvedValue(mockAlert);
      (prismaAlert.delete as jest.Mock).mockResolvedValue(mockAlert);

      const result = await service.remove('user-1', 'alert-1');
      expect(result.success).toBe(true);
    });

    it('throws for non-existent alert', async () => {
      (prismaAlert.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.remove('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    it('returns alert history', async () => {
      const history = [
        {
          id: 'h-1',
          alertId: 'alert-1',
          userId: 'user-1',
          triggerValue: 1.5,
          message: 'test',
          channels: '["IN_APP"]',
          readAt: null,
          createdAt: new Date(),
          alert: { alertType: 'PCR_CROSS', symbol: 'NIFTY' },
        },
      ];
      (prismaAlertHistory.findMany as jest.Mock).mockResolvedValue(history);

      const result = await service.getHistory('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toBe('test');
    });
  });

  describe('evaluateAndFire', () => {
    it('evaluates and fires triggered alert', async () => {
      (prismaAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);
      (marketService.getDashboard as jest.Mock).mockResolvedValue({
        pcr: 1.5,
        maxPain: 24100,
        totalCallOI: 5000000,
        totalPutOI: 5200000,
      });
      (prismaAlert.update as jest.Mock).mockResolvedValue(mockAlert);
      (prismaAlertHistory.create as jest.Mock).mockResolvedValue({});

      const result = await service.evaluateAndFire('alert-1');
      expect(result).toBe(true);
      expect(prismaAlertHistory.create).toHaveBeenCalled();
    });

    it('does not fire when alert is inactive', async () => {
      (prismaAlert.findUnique as jest.Mock).mockResolvedValue({
        ...mockAlert,
        isActive: false,
      });

      const result = await service.evaluateAndFire('alert-1');
      expect(result).toBe(false);
    });

    it('does not fire when condition not met', async () => {
      (prismaAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);
      (marketService.getDashboard as jest.Mock).mockResolvedValue({
        pcr: 0.5,
        maxPain: 24100,
        totalCallOI: 5000000,
        totalPutOI: 5200000,
      });

      const result = await service.evaluateAndFire('alert-1');
      expect(result).toBe(false);
    });
  });
});
