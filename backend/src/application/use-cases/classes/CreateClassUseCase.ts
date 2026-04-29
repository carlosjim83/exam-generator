import { FREE_TIER_LIMITS, LIMIT_ERRORS } from '@config/subscription-limits.js';
import { Class } from '@domain/entities/Class.js';
import { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import { ConflictError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class CreateClassCommand {
  constructor(
    public teacherId: string,
    public name: string,
    public description?: string,
    public color?: string
  ) {}
}

export class CreateClassUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly subscriptionRepository: ISubscriptionRepository | null = null,
    private readonly usageMetricsRepository: IUsageMetricsRepository | null = null
  ) {}

  async execute(command: CreateClassCommand): Promise<Class> {
    // Check subscription limits if repositories are available
    if (this.subscriptionRepository && this.usageMetricsRepository) {
      await this.enforceClassLimit(command.teacherId);
    }

    // Generate unique class code
    let code: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      code = this.generateClassCode();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique class code');
      }
    } while (await this.classRepository.existsByCode(code));

    const classEntity = new Class(
      new ClassId(),
      UserId.create(command.teacherId),
      command.name,
      code,
      command.description || null,
      command.color || null
    );

    await this.classRepository.save(classEntity);

    // Update usage metrics if repositories are available
    if (this.usageMetricsRepository) {
      await this.updateUsageMetrics(command.teacherId);
    }

    return classEntity;
  }

  /**
   * Enforce class limit based on subscription tier
   */
  private async enforceClassLimit(teacherId: string): Promise<void> {
    const teacherUserId = UserId.create(teacherId);

    // Get subscription
    const subscription = await this.subscriptionRepository!.findByTeacherId(teacherUserId);
    if (!subscription) {
      // Free tier by default, check usage
      await this.checkFreeTierLimit(teacherUserId);
      return;
    }

    // Get limits for current tier
    const limits = SubscriptionLimits.getForTier(subscription.tier);

    // If unlimited, skip check
    if (!limits.hasClassLimit()) {
      return;
    }

    // Get current usage
    const usageMetrics = await this.usageMetricsRepository!.findCurrentByTeacherId(teacherUserId);
    if (!usageMetrics) {
      // No metrics yet, allow creation (will be created on first action)
      return;
    }

    // Check if can add class
    if (!limits.canAddClass(usageMetrics.currentClasses)) {
      const errorMessage =
        subscription.tier === 'FREE' ? LIMIT_ERRORS.CLASS_LIMIT.FREE : LIMIT_ERRORS.CLASS_LIMIT.PRO;

      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Check Free tier limit (1 class maximum)
   */
  private async checkFreeTierLimit(teacherUserId: UserId): Promise<void> {
    const currentClasses = await this.classRepository.countByTeacherId(teacherUserId);

    if (currentClasses >= FREE_TIER_LIMITS.MAX_CLASSES) {
      throw new ConflictError(LIMIT_ERRORS.CLASS_LIMIT.FREE);
    }
  }

  /**
   * Update usage metrics to increment class count
   */
  private async updateUsageMetrics(teacherId: string): Promise<void> {
    try {
      const teacherUserId = UserId.create(teacherId);
      const subscription = await this.subscriptionRepository!.findByTeacherId(teacherUserId);

      if (!subscription) {
        // No subscription yet, skip metric update
        return;
      }

      const usageMetrics = await this.usageMetricsRepository!.getOrCreateCurrent(
        teacherUserId,
        subscription.id
      );

      await this.usageMetricsRepository!.incrementClassCount(usageMetrics.id);
    } catch (error) {
      // Log error but don't fail class creation
      console.error('Failed to update class usage metrics:', error);
    }
  }

  private generateClassCode(): string {
    // Use uppercase letters and digits, excluding confusing chars (O, 0, I, 1)
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * validChars.length);
      code += validChars[randomIndex];
    }

    return code;
  }
}
