import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaAlertHistory: Record<string, jest.Mock>;

  const mockNotification = {
    id: 'n-1',
    alertId: 'alert-1',
    userId: 'user-1',
    triggerValue: 1.5,
    message: 'NIFTY > 1.2 (current: 1.5)',
    channels: '["IN_APP"]',
    readAt: null,
    createdAt: new Date('2026-07-13'),
    alert: { alertType: 'PCR_CROSS', symbol: 'NIFTY' },
  };

  beforeEach(async () => {
    prismaAlertHistory = {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };

    const mockPrisma = {
      client: { alertHistory: prismaAlertHistory },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getUserNotifications', () => {
    it('returns notifications for user', async () => {
      (prismaAlertHistory.findMany as jest.Mock).mockResolvedValue([
        mockNotification,
      ]);
      const result = await service.getUserNotifications('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toContain('NIFTY');
    });

    it('respects limit parameter', async () => {
      (prismaAlertHistory.findMany as jest.Mock).mockResolvedValue([]);
      await service.getUserNotifications('user-1', 5);
      expect(prismaAlertHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      (prismaAlertHistory.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.markAsRead('n-1', 'user-1');
      expect(result.count).toBe(1);
    });

    it('scopes to userId', async () => {
      (prismaAlertHistory.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.markAsRead('n-1', 'user-1');
      expect(prismaAlertHistory.updateMany).toHaveBeenCalledWith({
        where: { id: 'n-1', userId: 'user-1' },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      (prismaAlertHistory.count as jest.Mock).mockResolvedValue(3);
      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
    });
  });

  describe('createNotification', () => {
    it('creates alert history record', async () => {
      (prismaAlertHistory.create as jest.Mock).mockResolvedValue(
        mockNotification,
      );
      const result = await service.createNotification({
        alertId: 'alert-1',
        userId: 'user-1',
        triggerValue: 1.5,
        message: 'test',
        channels: '["IN_APP"]',
      });
      expect(result.message).toBe('NIFTY > 1.2 (current: 1.5)');
    });
  });
});
