import { UserRole, AuthProvider } from '../../../domain/entities/User.js';
import { Email } from '../../../domain/value-objects/Email.js';
import { Password } from '../../../domain/value-objects/Password.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import { ITokenService, TokenPair } from '../../../domain/services/ITokenService.js';

/**
 * RegisterUserUseCase
 * Application use case for user registration
 * 
 * Responsibilities:
 * - Validate input data (via value objects)
 * - Check if email already exists
 * - Hash password
 * - Create user entity
 * - Persist user
 * - Generate JWT tokens
 */

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT'; // Use string literal for HTTP input
}

export interface RegisterUserOutput {
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

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Execute user registration
   * @param input - Registration input data
   * @returns User data and JWT tokens
   * @throws Error if email already exists or validation fails
   */
  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // 1. Create and validate value objects (throws if invalid)
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    // 2. Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // 3. Hash password
    const hashedPassword = await this.passwordHasher.hash(password);

    // 4. Create user via repository (generates ID automatically)
    const savedUser = await this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role as UserRole, // Convert string to enum
      provider: AuthProvider.LOCAL,
      providerId: null,
    });

    // 5. Generate JWT tokens
    const tokens = this.tokenService.generateTokenPair(
      savedUser.id,
      savedUser.email,
      savedUser.role
    );

    // 6. Return DTO (Data Transfer Object)
    return {
      user: {
        id: savedUser.id.value,
        email: savedUser.email.value,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        provider: savedUser.provider,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      tokens,
    };
  }
}
