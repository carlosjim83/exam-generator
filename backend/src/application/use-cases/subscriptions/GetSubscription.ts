import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import { Subscription } from '@domain/entities/Subscription.js';
import { SubscriptionLimit } from '@domain/value-objects/SubscriptionLimit.js';

export interface SubscriptionInfo {
  plan: string;
  status: string;
  isActive: boolean;
  limits: {
    examsPerMonth: number | null;
    maxStudents: number | null;
    maxActiveClasses: number | null;
    maxTeachers: number | null;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    hasSSO: boolean;
    hasCustomAI: boolean;
    hasSLA: boolean;
    supportType: string;
  };
  currentPeriod: {
    start: string | null;
    end: string | null;
  } | null;
  billing: {
    cycle: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
  } | null;
}

export interface UsageInfo {
  period: string;
  examsCreated: number;
  remaining: number | null;
  isUnlimited: boolean;
}

export interface GetSubscriptionResult {
  subscription: SubscriptionInfo | null;
  usage: UsageInfo;
}

export class GetSubscription {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(userId: string): Promise<GetSubscriptionResult> {
    // Get or create subscription
    let subscription = await this.subscriptionRepository.findByUserId(userId);
    
    if (!subscription) {
      subscription = Subscription.createNew(userId, 'FREE');
      await this.subscriptionRepository.create(subscription);
    }

    // Get current usage
    const currentPeriod = this.getCurrentPeriod();
    const usage = await this.subscriptionRepository.getUsageRecord(userId, currentPeriod);
    const examsCreated = usage?.examsCreated || 0;
    const remaining = SubscriptionLimit.getRemainingExams(subscription.plan, examsCreated);

    // Build subscription info
    const subscriptionInfo: SubscriptionInfo | null = subscription.isFree ? null : {
      plan: SubscriptionLimit.getPlanName(subscription.plan),
      status: subscription.status,
      isActive: subscription.isActive,
      limits: {
        examsPerMonth: subscription.limits.examsPerMonth,
        maxStudents: subscription.limits.maxStudents,
        maxActiveClasses: subscription.limits.maxActiveClasses,
        maxTeachers: subscription.limits.maxTeachers,
        hasAdvancedAnalytics: subscription.limits.hasAdvancedAnalytics,
        hasPrioritySupport: subscription.limits.hasPrioritySupport,
        hasSSO: subscription.limits.hasSSO,
        hasCustomAI: subscription.limits.hasCustomAI,
        hasSLA: subscription.limits.hasSLA,
        supportType: subscription.limits.supportType,
      },
      currentPeriod: subscription.currentPeriodStart && subscription.currentPeriodEnd ? {
        start: subscription.currentPeriodStart.toISOString(),
        end: subscription.currentPeriodEnd.toISOString(),
      } : null,
      billing: {
        cycle: subscription.props.billingCycle,
        cancelAtPeriodEnd: subscription.props.cancelAtPeriodEnd,
        cancelledAt: subscription.props.cancelledAt?.toISOString() || null,
      },
    };

    return {
      subscription: subscriptionInfo,
      usage: {
        period: currentPeriod,
        examsCreated,
        remaining,
        isUnlimited: subscription.limits.examsPerMonth === null,
      },
    };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}