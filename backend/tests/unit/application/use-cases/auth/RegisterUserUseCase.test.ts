import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { IPasswordHasher } from '@domain/services/IPasswordHasher.js';
import { ITokenService } from '@domain/services/ITokenService.js';
import { User, UserRole, AuthProvider } from '@domain/entities/User.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { Email } from '@domain/value-objects/Email.js';

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;
  let mockUserRepository: IUserRepository;
  let mockPasswordHasher: IPasswordHasher;
  let mockTokenService: ITokenService;

  beforeEach(() => {
    // Create mocks for dependencies
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
    };

    mockPasswordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };

    mockTokenService = {
      generateTokenPair: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };

    // Instantiate use case with mocks
    registerUserUseCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService
    );
  });

  describe('Successful registration', () => {
    it('should register a new user with valid data', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER' as const,
      };

      // Mock: email doesn't exist
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      // Mock: password hashing
      vi.mocked(mockPasswordHasher.hash).mockResolvedValue('hashed_password_123');

      // Mock: user creation
      const mockUserId = randomUUID();
      const mockUser = User.create({
        id: UserId.create(mockUserId),
        email: Email.create(input.email),
        passwordHash: 'hashed_password_123',
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);

      // Mock: token generation
      const mockTokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
      };
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue(mockTokens);

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUserId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.TEACHER,
          provider: AuthProvider.LOCAL,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        tokens: mockTokens,
      });

      // Verify interactions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'SecurePass123!' })
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: expect.objectContaining({ value: 'test@example.com' }),
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
      });
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId }),
        expect.objectContaining({ value: 'test@example.com' }),
        UserRole.TEACHER,
        0
      );
    });

    it('should register a STUDENT user', async () => {
      // Arrange
      const input = {
        email: 'student@example.com',
        password: 'StudentPass456!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'STUDENT' as const,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordHasher.hash).mockResolvedValue('hashed_student_pass');

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: 'hashed_student_pass',
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.STUDENT,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);

      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'student_access',
        refreshToken: 'student_refresh',
      });

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.user.email).toBe('student@example.com');
    });
  });

  describe('Validation errors', () => {
    it('should throw error if email already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER' as const,
      };

      const existingUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: 'hashed',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(registerUserUseCase.execute(input)).rejects.toThrow('Email already exists');

      // Verify password was never hashed (short-circuit)
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const input = {
        email: 'not-an-email',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER' as const,
      };

      // Act & Assert
      // Email.create() will throw during validation
      await expect(registerUserUseCase.execute(input)).rejects.toThrow();
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'weak', // Too short, no uppercase, no special char
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER' as const,
      };

      // Act & Assert
      // Password.create() will throw during validation
      await expect(registerUserUseCase.execute(input)).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should trim whitespace from email', async () => {
      // Arrange
      const input = {
        email: '  test@example.com  ',
        password: 'Pass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'TEACHER' as const,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordHasher.hash).mockResolvedValue('hashed');

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create('test@example.com'),
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
    });

    it('should handle names with special characters', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Pass123!',
        firstName: "O'Brien",
        lastName: 'García-López',
        role: 'TEACHER' as const,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordHasher.hash).mockResolvedValue('hashed');

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: 'hashed',
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser);
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Act
      const result = await registerUserUseCase.execute(input);

      // Assert
      expect(result.user.firstName).toBe("O'Brien");
      expect(result.user.lastName).toBe('García-López');
    });
  });
});
