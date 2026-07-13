import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserNotifications(userId: string, limit = 20) {
    return this.prismaService.client.alertHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { alert: { select: { alertType: true, symbol: true } } },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prismaService.client.alertHistory.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prismaService.client.alertHistory.count({
      where: { userId, readAt: null },
    });
  }

  async createNotification(data: {
    alertId: string;
    userId: string;
    triggerValue: number;
    message: string;
    channels: string;
  }) {
    return this.prismaService.client.alertHistory.create({ data });
  }
}
