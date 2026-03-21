import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import { Subscription } from '@domain/entities/Subscription.js';
import { SubscriptionLimit } from '@domain/value-objects/SubscriptionLimit.js';

export interface CheckLimitsResult {
  canCreateExam: boolean;
  currentUsage: number;
  limit: number | null; // null = unlimited
  remaining: number | null; // null = unlimited
  isUnlimited: boolean;
  planName: string;
}

export class CheckSubscriptionLimits {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(userId: string): Promise<CheckLimitsResult> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    
    if (!subscription) {
      // Create free subscription for new users
      const newSubscription = Subscription.createNew(userId, 'FREE');
      await this.subscriptionRepository.create(newSubscription);
      return this.buildResult(newSubscription, 0);
    }

    // Get current month usage
    const currentPeriod = this.getCurrentPeriod();
    const usage = await this.subscriptionRepository.getUsageRecord(userId, currentPeriod);
    const currentUsage = usage?.examsCreated || 0;

    return this.buildResult(subscription, currentUsage);
  }

  private buildResult(subscription: Subscription, currentUsage: number): CheckLimitsResult {
    const limits = subscription.limits;
    const canCreate = SubscriptionLimit.canCreateExam(subscription.plan, currentUsage);
    const remaining = SubscriptionLimit.getRemainingExams(subscription.plan, currentUsage);
    const planName = SubscriptionLimit.getPlanName(subscription.plan);

    return {
      canCreateExam: canCreate,
      currentUsage,
      limit: limits.examsPerMonth,
      remaining,
      isUnlimited: limits.examsPerMonth === null,
      planName,
    };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}