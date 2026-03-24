import { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { Subscription } from '@domain/entities/Subscription.js';
import { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import { UsageMetrics } from '@domain/entities/UsageMetrics.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * Result type for get subscription use case
 */
export interface SubscriptionResult {
  subscription: Subscription;
  limits: SubscriptionLimits;
  usage: UsageMetrics;
  limitsReached: {
    students: boolean;
    classes: boolean;
    exams: boolean;
  };
  upgradeNeeded: boolean;
}

/**
 * Use case: Get subscription with limits and current usage
 */
export class GetSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly usageMetricsRepo: IUsageMetricsRepository
  ) {}

  /**
   * Get or create subscription for a teacher
   * Automatically creates a Free tier subscription if none exists
   */
  async execute(teacherId: UserId): Promise<SubscriptionResult> {
    const userId = UserId.create(teacherId.value);

    // Get or create subscription
    let subscription = await this.subscriptionRepo.findByTeacherId(userId);

    if (!subscription) {
      // Create Free tier subscription
      subscription = Subscription.createFreeSubscription(userId);
      subscription = await this.subscriptionRepo.create(subscription);
    }

    // Get or create usage metrics
    const usageMetrics = await this.usageMetricsRepo.getOrCreateCurrent(userId, subscription.id);

    // Get limits for current tier
    const limits = SubscriptionLimits.getForTier(subscription.tier);

    // Check which limits are reached
    const limitsReached = {
      students: !limits.canAddStudent(usageMetrics.currentStudents),
      classes: !limits.canAddClass(usageMetrics.currentClasses),
      exams: !limits.canCreateExam(usageMetrics.examsCreatedThisMonth),
    };

    // Check if upgrade is needed
    const upgradeNeeded = limitsReached.students || limitsReached.classes || limitsReached.exams;

    return {
      subscription,
      limits,
      usage: usageMetrics,
      limitsReached,
      upgradeNeeded,
    };
  }

  /**
   * Create Free tier subscription for a new teacher
   */
  async createFreeSubscription(teacherId: UserId): Promise<Subscription> {
    const userId = UserId.create(teacherId.value);

    // Check if subscription already exists
    const existing = await this.subscriptionRepo.findByTeacherId(userId);
    if (existing) {
      return existing;
    }

    // Create Free tier subscription
    const subscription = Subscription.createFreeSubscription(userId);

    return await this.subscriptionRepo.create(subscription);
  }
}
