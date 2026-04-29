import { Subscription } from '@domain/entities/Subscription.js';
import { UsageMetrics } from '@domain/entities/UsageMetrics.js';
import type { UserRole } from '@domain/entities/User.js';
import { AuthProvider } from '@domain/entities/User.js';
import { ConflictError } from '@domain/errors/DomainError.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js';
import type { ITokenService, TokenPair } from '@domain/services/ITokenService.js';
import { Email } from '@domain/value-objects/Email.js';
import { Password } from '@domain/value-objects/Password.js';
import { UserId } from '@domain/value-objects/UserId.js';

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
 * - Automatically create free subscription for teachers
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
    private readonly tokenService: ITokenService,
    private readonly subscriptionRepository: ISubscriptionRepository | null = null,
    private readonly usageMetricsRepository: IUsageMetricsRepository | null = null
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
      throw new ConflictError('Email already exists');
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
      savedUser.role,
      savedUser.refreshTokenVersion
    );

    // 6. Automatically create Free tier subscription for teachers
    if (savedUser.isTeacher() && this.subscriptionRepository && this.usageMetricsRepository) {
      try {
        await this.createFreeSubscriptionForTeacher(savedUser.id.value);
      } catch (error) {
        // Don't fail registration if subscription creation fails
        console.error('Failed to create free subscription:', error);
      }
    }

    // 7. Return DTO (Data Transfer Object)
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

  /**
   * Create a Free tier subscription for a new teacher
   */
  private async createFreeSubscriptionForTeacher(userId: string): Promise<void> {
    // Create Free tier subscription
    const subscription = Subscription.createFreeSubscription(UserId.create(userId));

    const savedSubscription = await this.subscriptionRepository!.create(subscription);

    // Create initial usage metrics
    const usageMetrics = UsageMetrics.createInitial(UserId.create(userId), savedSubscription.id);

    await this.usageMetricsRepository!.create(usageMetrics);
  }
}
