import { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@prisma/client';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionLimit, PlanLimits } from '@domain/value-objects/SubscriptionLimit.js';

export interface SubscriptionProps {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  billingCycle: BillingCycle;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private _id!: string;
  private _userId!: string;
  private _plan!: SubscriptionPlan;
  private _status!: SubscriptionStatus;
  private _stripeCustomerId!: string | null;
  private _stripeSubscriptionId!: string | null;
  private _stripePriceId!: string | null;
  private _billingCycle!: BillingCycle;
  private _currentPeriodStart!: Date | null;
  private _currentPeriodEnd!: Date | null;
  private _cancelledAt!: Date | null;
  private _cancelAtPeriodEnd!: boolean;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  private constructor() {}

  // Factory methods
  static create(props: SubscriptionProps): Subscription {
    const subscription = new Subscription();
    subscription._id = props.id;
    subscription._userId = props.userId;
    subscription._plan = props.plan;
    subscription._status = props.status;
    subscription._stripeCustomerId = props.stripeCustomerId;
    subscription._stripeSubscriptionId = props.stripeSubscriptionId;
    subscription._stripePriceId = props.stripePriceId;
    subscription._billingCycle = props.billingCycle;
    subscription._currentPeriodStart = props.currentPeriodStart;
    subscription._currentPeriodEnd = props.currentPeriodEnd;
    subscription._cancelledAt = props.cancelledAt;
    subscription._cancelAtPeriodEnd = props.cancelAtPeriodEnd;
    subscription._createdAt = props.createdAt;
    subscription._updatedAt = props.updatedAt;
    return subscription;
  }

  static createNew(userId: string, plan: SubscriptionPlan = 'FREE'): Subscription {
    const now = new Date();
    return Subscription.create({
      id: crypto.randomUUID(),
      userId,
      plan,
      status: 'ACTIVE',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      billingCycle: 'MONTHLY',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): UserId {
    return UserId.create(this._userId);
  }

  get plan(): SubscriptionPlan {
    return this._plan;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get limits(): PlanLimits {
    return SubscriptionLimit.getLimits(this._plan);
  }

  get isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  get isFree(): boolean {
    return this._plan === 'FREE';
  }

  get currentPeriodStart(): Date | null {
    return this._currentPeriodStart;
  }

  get currentPeriodEnd(): Date | null {
    return this._currentPeriodEnd;
  }

  // Public props access for repository
  get props(): SubscriptionProps {
    return {
      id: this._id,
      userId: this._userId,
      plan: this._plan,
      status: this._status,
      stripeCustomerId: this._stripeCustomerId,
      stripeSubscriptionId: this._stripeSubscriptionId,
      stripePriceId: this._stripePriceId,
      billingCycle: this._billingCycle,
      currentPeriodStart: this._currentPeriodStart,
      currentPeriodEnd: this._currentPeriodEnd,
      cancelledAt: this._cancelledAt,
      cancelAtPeriodEnd: this._cancelAtPeriodEnd,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Business methods
  upgrade(plan: SubscriptionPlan): void {
    if (plan === 'FREE') {
      throw new Error('Cannot upgrade to FREE plan');
    }
    this._plan = plan;
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
  }

  cancel(): void {
    this._cancelledAt = new Date();
    this._cancelAtPeriodEnd = true;
    this._updatedAt = new Date();
  }

  reactivate(): void {
    if (!this._cancelledAt) {
      return;
    }
    this._cancelledAt = null;
    this._cancelAtPeriodEnd = false;
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
  }

  suspend(): void {
    this._status = 'SUSPENDED';
    this._updatedAt = new Date();
  }

  markPastDue(): void {
    this._status = 'PAST_DUE';
    this._updatedAt = new Date();
  }

  updatePeriod(start: Date, end: Date): void {
    this._currentPeriodStart = start;
    this._currentPeriodEnd = end;
    this._updatedAt = new Date();
  }

  setStripeInfo(customerId: string, subscriptionId: string, priceId: string): void {
    this._stripeCustomerId = customerId;
    this._stripeSubscriptionId = subscriptionId;
    this._stripePriceId = priceId;
    this._updatedAt = new Date();
  }

  toJSON(): SubscriptionProps {
    return this.props;
  }
}