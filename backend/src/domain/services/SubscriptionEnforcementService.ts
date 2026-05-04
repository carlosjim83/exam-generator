import { LIMIT_ERRORS } from '@config/subscription-limits.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import { ConflictError } from '@domain/errors/DomainError.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * SubscriptionEnforcementService
 * Domain service that encapsulates subscription limit enforcement logic.
 * Pure business rule checks with no external dependencies.
 */
export class SubscriptionEnforcementService {
  /**
   * Enforce class limit based on subscription tier.
   * Throws ConflictError when the limit is exceeded.
   */
  enforceClassLimit(currentClasses: number, tier: SubscriptionTier): void {
    const limits = SubscriptionLimits.getForTier(tier);

    if (!limits.hasClassLimit()) {
      return;
    }

    if (!limits.canAddClass(currentClasses)) {
      const errorMessage =
        tier === SubscriptionTier.FREE
          ? LIMIT_ERRORS.CLASS_LIMIT.FREE
          : LIMIT_ERRORS.CLASS_LIMIT.PRO;
      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Enforce student limit based on subscription tier.
   * Throws ConflictError when the limit is exceeded.
   */
  enforceStudentLimit(currentStudents: number, tier: SubscriptionTier): void {
    const limits = SubscriptionLimits.getForTier(tier);

    if (!limits.hasStudentLimit()) {
      return;
    }

    if (!limits.canAddStudent(currentStudents)) {
      const errorMessage =
        tier === SubscriptionTier.FREE
          ? LIMIT_ERRORS.STUDENT_LIMIT.FREE
          : LIMIT_ERRORS.STUDENT_LIMIT.PRO;
      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Enforce monthly exam limit based on subscription tier.
   * Throws ConflictError when the limit is exceeded.
   */
  enforceExamLimit(examsThisMonth: number, tier: SubscriptionTier): void {
    const limits = SubscriptionLimits.getForTier(tier);

    if (!limits.hasExamLimit()) {
      return;
    }

    if (!limits.canCreateExam(examsThisMonth)) {
      const errorMessage =
        tier === SubscriptionTier.FREE ? LIMIT_ERRORS.EXAM_LIMIT.FREE : LIMIT_ERRORS.EXAM_LIMIT.PRO;
      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Enforce per-exam question limit based on subscription tier.
   * Throws ConflictError when the limit is exceeded.
   */
  enforceQuestionLimit(questionCount: number, tier: SubscriptionTier): void {
    const limits = SubscriptionLimits.getForTier(tier);

    if (!limits.hasQuestionLimit()) {
      return;
    }

    if (!limits.canAddQuestions(questionCount)) {
      const errorMessage =
        tier === SubscriptionTier.FREE
          ? LIMIT_ERRORS.QUESTION_LIMIT.FREE
          : LIMIT_ERRORS.QUESTION_LIMIT.PRO;
      throw new ConflictError(errorMessage);
    }
  }

  // ---------------------------------------------------------------------------
  // Async convenience methods — look up subscription + metrics, then enforce
  // ---------------------------------------------------------------------------

  async checkClassLimit(
    teacherId: string,
    subscriptionRepository: ISubscriptionRepository,
    usageMetricsRepository: IUsageMetricsRepository
  ): Promise<void> {
    const userId = UserId.create(teacherId);
    const subscription = await subscriptionRepository.findByTeacherId(userId);
    const metrics = await usageMetricsRepository.findCurrentByTeacherId(userId);
    this.enforceClassLimit(
      metrics?.currentClasses ?? 0,
      subscription?.tier ?? SubscriptionTier.FREE
    );
  }

  async checkStudentLimit(
    teacherId: string,
    subscriptionRepository: ISubscriptionRepository,
    usageMetricsRepository: IUsageMetricsRepository
  ): Promise<void> {
    const userId = UserId.create(teacherId);
    const subscription = await subscriptionRepository.findByTeacherId(userId);
    const metrics = await usageMetricsRepository.findCurrentByTeacherId(userId);
    this.enforceStudentLimit(
      metrics?.currentStudents ?? 0,
      subscription?.tier ?? SubscriptionTier.FREE
    );
  }

  async checkExamLimit(
    teacherId: string,
    subscriptionRepository: ISubscriptionRepository,
    usageMetricsRepository: IUsageMetricsRepository
  ): Promise<void> {
    const userId = UserId.create(teacherId);
    const subscription = await subscriptionRepository.findByTeacherId(userId);
    const metrics = await usageMetricsRepository.findCurrentByTeacherId(userId);
    this.enforceExamLimit(
      metrics?.examsCreatedThisMonth ?? 0,
      subscription?.tier ?? SubscriptionTier.FREE
    );
  }
}
