import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ITokenService, DecodedRefreshToken } from '@domain/services/ITokenService.js';
import { UserRole } from '@domain/entities/User.js';
import { UserMother } from '@tests/helpers/factories/UserMother.js';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepository: IUserRepository;
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

    mockTokenService = {
      generateTokenPair: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };

    // Instantiate use case with mocks
    refreshTokenUseCase = new RefreshTokenUseCase(mockUserRepository, mockTokenService);
  });

  describe('Successful token refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        refreshToken: 'valid_refresh_token',
      };

      // Mock: decode refresh token (version matches user)
      const decodedToken: DecodedRefreshToken = {
        userId: mockUserId,
        version: 0,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      // Mock: user exists
      const mockUser = UserMother.teacher({ id: mockUserId });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      // Mock: new token pair
      const mockNewTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };
      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue(mockNewTokens);

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        tokens: mockNewTokens,
      });

      // Verify interactions
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId })
      );
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId }),
        expect.objectContaining({ value: 'test@example.com' }),
        UserRole.TEACHER,
        1 // version incremented after rotation
      );
    });

    it('should refresh tokens for STUDENT user', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        refreshToken: 'student_refresh_token',
      };

      const decodedToken: DecodedRefreshToken = {
        userId: mockUserId,
        version: 0,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      const mockUser = UserMother.student({ id: mockUserId, email: 'student@example.com' });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'student_access',
        refreshToken: 'student_refresh',
      });

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result.tokens).toBeDefined();
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId }),
        expect.objectContaining({ value: 'student@example.com' }),
        UserRole.STUDENT,
        1
      );
    });
  });

  describe('Token validation failures', () => {
    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const input = {
        refreshToken: 'invalid_token',
      };

      // Mock: token verification throws
      vi.mocked(mockTokenService.verifyRefreshToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Invalid token');

      // Verify user lookup was never called (short-circuit)
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw error for expired refresh token', async () => {
      // Arrange
      const input = {
        refreshToken: 'expired_token',
      };

      // Mock: token verification throws expired error
      vi.mocked(mockTokenService.verifyRefreshToken).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('Token expired');

      // Verify user lookup was never called
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error if user no longer exists', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        refreshToken: 'valid_refresh_token',
      };

      const decodedToken: DecodedRefreshToken = {
        userId: mockUserId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      // Mock: user not found (deleted account)
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('User not found');

      // Verify token generation was never called
      expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw error if decoded token has invalid userId format', async () => {
      // Arrange
      const input = {
        refreshToken: 'token_with_invalid_userid',
      };

      const decodedToken: DecodedRefreshToken = {
        userId: 'not-a-valid-uuid', // Invalid UUID format
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      // Act & Assert
      // UserId.create() will throw, caught and re-thrown as "User not found"
      await expect(refreshTokenUseCase.execute(input)).rejects.toThrow('User not found');

      // Verify repository was never called (short-circuit)
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle OAuth user token refresh', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        refreshToken: 'oauth_user_refresh',
      };

      const decodedToken: DecodedRefreshToken = {
        userId: mockUserId,
        version: 0,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      // OAuth user (no password)
      const mockOAuthUser = UserMother.oauth({ id: mockUserId, email: 'oauth@example.com' });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockOAuthUser);

      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'oauth_access',
        refreshToken: 'oauth_refresh',
      });

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result.tokens).toBeDefined();
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockUserId }),
        expect.objectContaining({ value: 'oauth@example.com' }),
        UserRole.TEACHER,
        1
      );
    });

    it('should generate new tokens even if same user immediately refreshes', async () => {
      // Arrange
      const mockUserId = randomUUID();
      const input = {
        refreshToken: 'refresh_token_1',
      };

      const decodedToken: DecodedRefreshToken = {
        userId: mockUserId,
        version: 0,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(mockTokenService.verifyRefreshToken).mockReturnValue(decodedToken);

      const mockUser = UserMother.teacher({ id: mockUserId });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      vi.mocked(mockTokenService.generateTokenPair).mockReturnValue({
        accessToken: 'new_access_1',
        refreshToken: 'new_refresh_1',
      });

      // Act
      const result = await refreshTokenUseCase.execute(input);

      // Assert
      expect(result.tokens.accessToken).toBe('new_access_1');
      expect(result.tokens.refreshToken).toBe('new_refresh_1');
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledTimes(1);
    });
  });
});
