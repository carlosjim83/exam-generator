import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { LoginUserUseCase } from '@application/use-cases/auth/LoginUserUseCase.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { IPasswordHasher } from '@domain/services/IPasswordHasher.js';
import { ITokenService } from '@domain/services/ITokenService.js';
import { User, UserRole, AuthProvider } from '@domain/entities/User.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { Email } from '@domain/value-objects/Email.js';
// Password imported but not used - keeping for potential future use
// import { Password } from '@domain/value-objects/Password.js';

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
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
    loginUserUseCase = new LoginUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService
    );
  });

  describe('Successful login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUserId = randomUUID();
      const mockUser = User.create({
        id: UserId.create(mockUserId),
        email: Email.create(input.email),
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock: user exists
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);

      // Mock: password matches
      vi.mocked(mockPasswordHasher.compare).mockResolvedValue(true);

      // Mock: token generation
      const mockTokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
      };
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue(mockTokens);

      // Act
      const result = await loginUserUseCase.execute(input);

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
      expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'SecurePass123!' }),
        'hashed_password'
      );
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId }),
        expect.objectContaining({ value: 'test@example.com' }),
        UserRole.TEACHER,
        0
      );
    });

    it('should login STUDENT user', async () => {
      // Arrange
      const input = {
        email: 'student@example.com',
        password: 'StudentPass456!',
      };

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: 'hashed_student_pass',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHasher.compare).mockResolvedValue(true);
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'student_access',
        refreshToken: 'student_refresh',
      });

      // Act
      const result = await loginUserUseCase.execute(input);

      // Assert
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.user.email).toBe('student@example.com');
    });
  });

  describe('Authentication failures', () => {
    it('should throw error for non-existent email', async () => {
      // Arrange
      const input = {
        email: 'nonexistent@example.com',
        password: 'Pass123!',
      };

      // Mock: user not found
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid credentials');

      // Verify password was never checked (short-circuit)
      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw error for wrong password', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TEACHER,
        provider: AuthProvider.LOCAL,
        providerId: null,
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock: user exists but password doesn't match
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHasher.compare).mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow('Invalid credentials');

      // Verify token was never generated (short-circuit)
      expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw error for OAuth user trying to login with password', async () => {
      // Arrange
      const input = {
        email: 'oauth@example.com',
        password: 'Pass123!',
      };

      // Create OAuth user (no passwordHash)
      const mockOAuthUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create(input.email),
        passwordHash: null, // OAuth users have no password
        firstName: 'OAuth',
        lastName: 'User',
        role: UserRole.TEACHER,
        provider: AuthProvider.GOOGLE,
        providerId: 'google-123',
        refreshTokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockOAuthUser);

      // Act & Assert
      await expect(loginUserUseCase.execute(input)).rejects.toThrow(
        'This account uses OAuth authentication. Please sign in with your provider.'
      );

      // Verify password was never checked (short-circuit)
      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid email format', async () => {
      // Arrange
      const input = {
        email: 'not-an-email',
        password: 'Pass123!',
      };

      // Act & Assert
      // Email.create() will throw during validation
      await expect(loginUserUseCase.execute(input)).rejects.toThrow();

      // Verify repository was never called
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error for weak password format', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'weak', // Too short, no uppercase, no special char
      };

      // Act & Assert
      // Password.create() will throw during validation
      await expect(loginUserUseCase.execute(input)).rejects.toThrow();

      // Verify repository was never called
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should trim whitespace from email', async () => {
      // Arrange
      const input = {
        email: '  test@example.com  ',
        password: 'Pass123!',
      };

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

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHasher.compare).mockResolvedValue(true);
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Act
      const result = await loginUserUseCase.execute(input);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
    });

    it('should handle case-insensitive email lookup', async () => {
      // Arrange
      const input = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Pass123!',
      };

      const mockUser = User.create({
        id: UserId.create(randomUUID()),
        email: Email.create('test@example.com'), // Stored as lowercase
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

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordHasher.compare).mockResolvedValue(true);
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Act
      const result = await loginUserUseCase.execute(input);

      // Assert
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
    });
  });
});
