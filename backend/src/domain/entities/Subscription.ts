import { ConflictError, ValidationError } from '@domain/errors/DomainError.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * Subscription Tier Enum
 * Defines the different subscription tiers available
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PRO_PLUS = 'PRO_PLUS',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Subscription Status Enum
 * Defines the current status of a subscription
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * Billing Cycle Enum
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface SubscriptionProps {
  id: SubscriptionId;
  teacherId: UserId;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Entity
 * Represents a teacher's subscription to Formydable
 */
export class Subscription {
  private constructor(private props: SubscriptionProps) {}

  static create(props: SubscriptionProps): Subscription {
    // Validation rules
    if (!props.currentPeriodStart) {
      throw new ValidationError('Current period start is required');
    }
    if (!props.currentPeriodEnd) {
      throw new ValidationError('Current period end is required');
    }

    // Free tier subscriptions should not have Stripe IDs
    if (props.tier === SubscriptionTier.FREE) {
      if (props.stripeSubscriptionId || props.stripeCustomerId) {
        throw new ValidationError('Free tier cannot have Stripe IDs');
      }
    }

    // Paid tiers should have Stripe customer ID (subscription ID is created after checkout)
    if (props.tier !== SubscriptionTier.FREE && !props.stripeCustomerId) {
      throw new ValidationError('Paid tiers require a Stripe customer ID');
    }

    return new Subscription(props);
  }

  static createFreeSubscription(teacherId: UserId): Subscription {
    const now = new Date();
    // Free subscription never expires, set end to far future
    const future = new Date();
    future.setFullYear(future.getFullYear() + 100);

    return Subscription.create({
      id: SubscriptionId.generate(),
      teacherId,
      tier: SubscriptionTier.FREE,
      billingCycle: BillingCycle.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Getters
  get id(): SubscriptionId {
    return this.props.id;
  }

  get teacherId(): UserId {
    return this.props.teacherId;
  }

  get tier(): SubscriptionTier {
    return this.props.tier;
  }

  get billingCycle(): BillingCycle {
    return this.props.billingCycle;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get currentPeriodStart(): Date {
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    return this.props.currentPeriodEnd;
  }

  get cancelAtPeriodEnd(): boolean {
    return this.props.cancelAtPeriodEnd;
  }

  get stripeSubscriptionId(): string | undefined {
    return this.props.stripeSubscriptionId;
  }

  get stripeCustomerId(): string | undefined {
    return this.props.stripeCustomerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  isActive(): boolean {
    return this.props.status === SubscriptionStatus.ACTIVE;
  }

  isFreeTier(): boolean {
    return this.props.tier === SubscriptionTier.FREE;
  }

  isPaidTier(): boolean {
    return this.props.tier !== SubscriptionTier.FREE;
  }

  isPastDue(): boolean {
    return this.props.status === SubscriptionStatus.PAST_DUE;
  }

  isCancelled(): boolean {
    return this.props.status === SubscriptionStatus.CANCELLED || this.props.cancelAtPeriodEnd;
  }

  shouldDowngradeAtPeriodEnd(): boolean {
    return this.props.cancelAtPeriodEnd;
  }

  markForCancellation(): Subscription {
    return new Subscription({
      ...this.props,
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    });
  }

  revertCancellation(): Subscription {
    return new Subscription({
      ...this.props,
      cancelAtPeriodEnd: false,
      status: SubscriptionStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  updateStatus(status: SubscriptionStatus): Subscription {
    return new Subscription({
      ...this.props,
      status,
      updatedAt: new Date(),
    });
  }

  upgradeTier(
    newTier: SubscriptionTier,
    newBillingCycle: BillingCycle,
    stripeSubscriptionId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  ): Subscription {
    if (newTier === this.props.tier) {
      throw new ConflictError('New tier must be different from current tier');
    }

    return new Subscription({
      ...this.props,
      tier: newTier,
      billingCycle: newBillingCycle,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    });
  }

  toObject() {
    return {
      id: this.props.id.value,
      teacherId: this.props.teacherId.value,
      tier: this.props.tier,
      billingCycle: this.props.billingCycle,
      status: this.props.status,
      currentPeriodStart: this.props.currentPeriodStart,
      currentPeriodEnd: this.props.currentPeriodEnd,
      cancelAtPeriodEnd: this.props.cancelAtPeriodEnd,
      stripeSubscriptionId: this.props.stripeSubscriptionId,
      stripeCustomerId: this.props.stripeCustomerId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
