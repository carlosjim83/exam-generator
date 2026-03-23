import type { Subscription } from '@domain/entities/Subscription.js';
import type { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import type { UserId } from '@domain/value-objects/UserId.js';
import type { SubscriptionTier, SubscriptionStatus } from '@domain/entities/Subscription.js';

/**
 * Repository interface for Subscription entity
 */
export interface ISubscriptionRepository {
  /**
   * Create a new subscription
   */
  create(subscription: Subscription): Promise<Subscription>;

  /**
   * Find subscription by ID
   */
  findById(id: SubscriptionId): Promise<Subscription | null>;

  /**
   * Find subscription by teacher ID
   */
  findByTeacherId(teacherId: UserId): Promise<Subscription | null>;

  /**
   * Update subscription
   */
  update(subscription: Subscription): Promise<Subscription>;

  /**
   * Update subscription status
   */
  updateStatus(id: SubscriptionId, status: SubscriptionStatus): Promise<void>;

  /**
   * Mark subscription for cancellation (soft delete at period end)
   */
  markForCancellation(id: SubscriptionId): Promise<void>;

  /**
   * Revert cancellation
   */
  revertCancellation(id: SubscriptionId): Promise<void>;

  /**
   * Find all subscriptions that should be downgraded at period end
   * (cancelAtPeriodEnd = true and currentPeriodEnd is past)
   */
  findSubscriptionsToDowngrade(): Promise<Subscription[]>;

  /**
   * Find all subscriptions with past_due status
   */
  findPastDueSubscriptions(): Promise<Subscription[]>;

  /**
   * Find subscription by Stripe subscription ID
   */
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;

  /**
   * Find subscription by Stripe customer ID
   */
  findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null>;

  /**
   * Delete subscription (hard delete - use with caution)
   */
  delete(id: SubscriptionId): Promise<void>;

  /**
   * Get count of active subscriptions by tier
   */
  countByTier(tier: SubscriptionTier): Promise<number>;

  /**
   * Get all subscriptions for a specific tier
   */
  findByTier(tier: SubscriptionTier): Promise<Subscription[]>;
}
