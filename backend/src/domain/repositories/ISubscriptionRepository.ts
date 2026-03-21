import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { Subscription } from '@domain/entities/Subscription.js';

export interface ISubscriptionRepository {
  /**
   * Find subscription by user ID
   */
  findByUserId(userId: string): Promise<Subscription | null>;
  
  /**
   * Find subscription by Stripe customer ID
   */
  findByStripeCustomerId(customerId: string): Promise<Subscription | null>;
  
  /**
   * Find subscription by Stripe subscription ID
   */
  findByStripeSubscriptionId(subscriptionId: string): Promise<Subscription | null>;
  
  /**
   * Create a new subscription
   */
  create(subscription: Subscription): Promise<Subscription>;
  
  /**
   * Update an existing subscription
   */
  update(subscription: Subscription): Promise<Subscription>;
  
  /**
   * Delete a subscription
   */
  delete(userId: string): Promise<void>;
  
  /**
   * Get usage record for a specific period (YYYY-MM)
   */
  getUsageRecord(userId: string, period: string): Promise<{ examsCreated: number } | null>;
  
  /**
   * Update or create usage record
   */
  upsertUsageRecord(userId: string, period: string, examsCreated: number): Promise<void>;
  
  /**
   * Increment exam count
   */
  incrementExamCount(userId: string, period: string): Promise<number>;
}