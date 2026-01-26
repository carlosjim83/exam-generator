import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { prisma } from '@/config/prisma';
import type { RegisterRequest } from '@exam-generator/shared';

// Mock Prisma
vi.mock('@/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      const password = 'mySecurePassword123';
      const hashed = await authService.hashPassword(password);

      expect(hashed).not.toBe(password);
      expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt format
      expect(hashed.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password (salt)', async () => {
      const password = 'samePassword';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(authService.hashPassword('')).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'myPassword123';
      const hashed = await authService.hashPassword(password);
      
      const isMatch = await authService.comparePassword(password, hashed);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'myPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await authService.hashPassword(password);
      
      const isMatch = await authService.comparePassword(wrongPassword, hashed);
      expect(isMatch).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterRequest = {
        email: 'newteacher@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
      };

      const mockUser = {
        id: 'user-123',
        email: registerData.email,
        password: 'hashed_password',
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: 'TEACHER',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const result = await authService.register(registerData);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        provider: mockUser.provider,
        providerId: mockUser.providerId,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          password: expect.any(String),
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: registerData.role,
          provider: 'LOCAL',
        },
      });
    });

    it('should throw error if email already exists', async () => {
      const registerData: RegisterRequest = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'TEACHER',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: registerData.email,
        password: 'hashed',
        firstName: 'Existing',
        lastName: 'User',
        role: 'TEACHER',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.register(registerData)).rejects.toThrow(
        'Email already exists'
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password before storing', async () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'PlainTextPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-456',
        email: registerData.email,
        password: '$2b$10$hashedpassword',
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: 'STUDENT',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authService.register(registerData);

      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
      const storedPassword = createCall.data.password;

      expect(storedPassword).not.toBe(registerData.password);
      expect(storedPassword).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'teacher@example.com';
      const mockUser = {
        id: 'user-789',
        email,
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Teacher',
        role: 'TEACHER',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await authService.findUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.findUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('validateCredentials', () => {
    it('should return user for valid credentials', async () => {
      const email = 'teacher@example.com';
      const password = 'correctPassword';
      const hashedPassword = await authService.hashPassword(password);

      const mockUser = {
        id: 'user-999',
        email,
        password: hashedPassword,
        firstName: 'Valid',
        lastName: 'User',
        role: 'TEACHER',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await authService.validateCredentials(email, password);

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid password', async () => {
      const email = 'teacher@example.com';
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await authService.hashPassword(correctPassword);

      const mockUser = {
        id: 'user-999',
        email,
        password: hashedPassword,
        firstName: 'Valid',
        lastName: 'User',
        role: 'TEACHER',
        provider: 'LOCAL',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await authService.validateCredentials(email, wrongPassword);

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'anyPassword';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.validateCredentials(email, password);

      expect(result).toBeNull();
    });

    it('should return null if user has no password (OAuth user)', async () => {
      const email = 'oauth@example.com';
      const password = 'anyPassword';

      const mockOAuthUser = {
        id: 'oauth-user',
        email,
        password: null,
        firstName: 'OAuth',
        lastName: 'User',
        role: 'TEACHER',
        provider: 'GOOGLE',
        providerId: 'google_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOAuthUser);

      const result = await authService.validateCredentials(email, password);

      expect(result).toBeNull();
    });
  });
});
