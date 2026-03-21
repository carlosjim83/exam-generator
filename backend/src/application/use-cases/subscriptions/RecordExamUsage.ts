import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import { Subscription } from '@domain/entities/Subscription.js';
import { SubscriptionLimit } from '@domain/value-objects/SubscriptionLimit.js';

export interface RecordUsageResult {
  success: boolean;
  newCount: number;
  canCreateMore: boolean;
  remaining: number | null;
}

export class RecordExamUsage {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(userId: string): Promise<RecordUsageResult> {
    // Get or create subscription
    let subscription = await this.subscriptionRepository.findByUserId(userId);
    
    if (!subscription) {
      subscription = Subscription.createNew(userId, 'FREE');
      await this.subscriptionRepository.create(subscription);
    }

    // Get current period
    const currentPeriod = this.getCurrentPeriod();
    
    // Check if user can create more exams
    const usage = await this.subscriptionRepository.getUsageRecord(userId, currentPeriod);
    const currentUsage = usage?.examsCreated || 0;
    
    const canCreate = SubscriptionLimit.canCreateExam(subscription.plan, currentUsage);
    
    if (!canCreate) {
      return {
        success: false,
        newCount: currentUsage,
        canCreateMore: false,
        remaining: SubscriptionLimit.getRemainingExams(subscription.plan, currentUsage),
      };
    }

    // Increment usage
    const newCount = await this.subscriptionRepository.incrementExamCount(userId, currentPeriod);
    const remaining = SubscriptionLimit.getRemainingExams(subscription.plan, newCount);

    return {
      success: true,
      newCount,
      canCreateMore: remaining === null || remaining > 0,
      remaining,
    };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}