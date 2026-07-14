import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';

describe('UserService', () => {
  let service: UserService;
  let prismaUserMock: Record<string, jest.Mock>;
  let prismaPrefsMock: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'FREE',
    authProvider: 'EMAIL',
    createdAt: new Date('2026-07-13'),
  };
  const mockPreferences = {
    id: 'prefs-1',
    userId: 'user-1',
    theme: 'dark',
    defaultIndex: 'NIFTY',
    defaultExpiry: null,
    notifications: true,
    emailAlerts: true,
    telegramChatId: null,
    createdAt: new Date('2026-07-13'),
    updatedAt: new Date('2026-07-13'),
  };

  beforeEach(async () => {
    prismaUserMock = { findUnique: jest.fn(), update: jest.fn() };
    prismaPrefsMock = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockPrisma = {
      client: { user: prismaUserMock, userPreferences: prismaPrefsMock },
    };

    const mockEncryption = { encrypt: jest.fn(), decrypt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('getProfile', () => {
    it('returns user profile', async () => {
      (prismaUserMock.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.getProfile('user-1');
      expect(result.email).toBe('test@example.com');
    });

    it('throws for non-existent user', async () => {
      (prismaUserMock.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getProfile('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates user name', async () => {
      (prismaUserMock.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      });
      const result = await service.updateProfile('user-1', {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });
  });

  describe('getPreferences', () => {
    it('returns existing preferences', async () => {
      (prismaPrefsMock.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences,
      );
      const result = await service.getPreferences('user-1');
      expect(result.theme).toBe('dark');
    });

    it('creates preferences if not found', async () => {
      (prismaPrefsMock.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaPrefsMock.create as jest.Mock).mockResolvedValue(mockPreferences);
      const result = await service.getPreferences('user-1');
      expect(prismaPrefsMock.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
      expect(result.theme).toBe('dark');
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences', async () => {
      (prismaPrefsMock.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences,
      );
      (prismaPrefsMock.update as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        defaultIndex: 'BANKNIFTY',
      });
      const result = await service.updatePreferences('user-1', {
        defaultIndex: 'BANKNIFTY',
      });
      expect(result.defaultIndex).toBe('BANKNIFTY');
    });
  });
});
