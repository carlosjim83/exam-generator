import { UserId } from '../../../domain/value-objects/UserId.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { ITokenService, TokenPair } from '../../../domain/services/ITokenService.js';

/**
 * RefreshTokenUseCase
 * Application use case for refreshing JWT access tokens
 * 
 * Responsibilities:
 * - Validate refresh token
 * - Find user by ID
 * - Generate new token pair
 */

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  tokens: TokenPair;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Execute token refresh
   * @param input - Refresh token
   * @returns New token pair
   * @throws Error if refresh token is invalid or user not found
   */
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Verify refresh token (throws if invalid/expired)
    const decoded = this.tokenService.verifyRefreshToken(input.refreshToken);

    // 2. Create UserId value object (wrap in try-catch to provide better error)
    let userId: UserId;
    try {
      userId = UserId.create(decoded.userId);
    } catch (error) {
      throw new Error('User not found');
    }

    // 3. Find user (ensure user still exists)
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 4. Generate new token pair
    const tokens = this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    // 5. Return new tokens
    return { tokens };
  }
}
