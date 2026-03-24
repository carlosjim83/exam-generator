/**
 * Subscription Mother Object
 * Factory for creating test Subscription entities
 */
import {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
} from '@domain/entities/Subscription.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class SubscriptionMother {
  /**
   * Create a FREE tier subscription with valid defaults
   */
  static createFree(
    overrides: Partial<{
      id: string;
      teacherId: string;
    }> = {}
  ): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(overrides.id ?? '123e4567-e89b-42d3-a456-426614174000'),
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      tier: SubscriptionTier.FREE,
      billingCycle: 'MONTHLY',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create a PRO tier subscription
   */
  static createPro(
    overrides: Partial<{
      id: string;
      teacherId: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
    }> = {}
  ): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(overrides.id ?? '123e4567-e89b-42d3-a456-426614174002'),
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      tier: SubscriptionTier.PRO,
      billingCycle: 'MONTHLY',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: overrides.stripeSubscriptionId ?? 'sub_stripe_123',
      stripeCustomerId: overrides.stripeCustomerId ?? 'cust_stripe_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create a PRO_PLUS tier subscription
   */
  static createProPlus(
    overrides: Partial<{
      id: string;
      teacherId: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
    }> = {}
  ): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(overrides.id ?? '123e4567-e89b-42d3-a456-426614174003'),
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      tier: SubscriptionTier.PRO_PLUS,
      billingCycle: 'YEARLY',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: overrides.stripeSubscriptionId ?? 'sub_stripe_456',
      stripeCustomerId: overrides.stripeCustomerId ?? 'cust_stripe_456',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create a subscription that is past due
   */
  static createPastDue(
    overrides: Partial<{
      id: string;
      teacherId: string;
    }> = {}
  ): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(overrides.id ?? '123e4567-e89b-42d3-a456-426614174004'),
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      tier: SubscriptionTier.PRO,
      billingCycle: 'MONTHLY',
      status: SubscriptionStatus.PAST_DUE,
      currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'sub_stripe_789',
      stripeCustomerId: 'cust_stripe_789',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }
}
