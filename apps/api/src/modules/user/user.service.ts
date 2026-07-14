import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        authProvider: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.prismaService.client.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        authProvider: true,
        createdAt: true,
      },
    });
    return user;
  }

  async getPreferences(userId: string) {
    let prefs = await this.prismaService.client.userPreferences.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prismaService.client.userPreferences.create({
        data: { userId },
      });
    }
    return prefs;
  }

  async updatePreferences(
    userId: string,
    data: {
      theme?: string;
      defaultIndex?: string;
      defaultExpiry?: string;
      notifications?: boolean;
      emailAlerts?: boolean;
      byoOpenaiKey?: string | null;
    },
  ) {
    const updateData: Record<string, unknown> = { ...data };

    if (data.byoOpenaiKey !== undefined) {
      if (data.byoOpenaiKey === null || data.byoOpenaiKey === '') {
        updateData.byoOpenaiKey = null;
      } else {
        updateData.byoOpenaiKey = this.encryptionService.encrypt(
          data.byoOpenaiKey,
        );
      }
    }

    await this.getPreferences(userId);

    return this.prismaService.client.userPreferences.update({
      where: { userId },
      data: updateData as any,
    });
  }
}
