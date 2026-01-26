import { Email } from '../../../domain/value-objects/Email.js';
import { Password } from '../../../domain/value-objects/Password.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import { ITokenService, TokenPair } from '../../../domain/services/ITokenService.js';
import { UserRole } from '../../../domain/entities/User.js';

/**
 * LoginUserUseCase
 * Application use case for user login
 * 
 * Responsibilities:
 * - Validate input credentials
 * - Find user by email
 * - Verify password
 * - Generate JWT tokens
 */

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: TokenPair;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Execute user login
   * @param input - Login credentials
   * @returns User data and JWT tokens
   * @throws Error if credentials are invalid
   */
  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // 1. Create and validate value objects (throws if invalid)
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 3. Check if user has a password (OAuth users don't have passwords)
    if (!user.password) {
      throw new Error('This account uses OAuth authentication. Please sign in with your provider.');
    }

    // 4. Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 5. Generate JWT tokens
    const tokens = this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    // 6. Return DTO (Data Transfer Object)
    return {
      user: {
        id: user.id.value,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }
}
