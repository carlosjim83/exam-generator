import type { Prisma, PrismaClient } from '@prisma/client';

import { Subscription } from '@domain/entities/Subscription.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * PrismaSubscriptionRepository
 * Infrastructure implementation of ISubscriptionRepository using Prisma ORM
 */
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaSubscriptionRepository {
    return new PrismaSubscriptionRepository(prismaClient);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByStripeCustomerId(customerId: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByStripeSubscriptionId(subscriptionId: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const data = {
      id: subscription.id,
      userId: subscription.userId.value,
      plan: subscription.plan,
      status: subscription.status,
      stripeCustomerId: subscription.props.stripeCustomerId,
      stripeSubscriptionId: subscription.props.stripeSubscriptionId,
      stripePriceId: subscription.props.stripePriceId,
      billingCycle: subscription.props.billingCycle,
      currentPeriodStart: subscription.props.currentPeriodStart,
      currentPeriodEnd: subscription.props.currentPeriodEnd,
      cancelledAt: subscription.props.cancelledAt,
      cancelAtPeriodEnd: subscription.props.cancelAtPeriodEnd,
    };

    const record = await this.prisma.subscription.create({
      data,
    });

    return this.toDomain(record);
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const data = {
      plan: subscription.plan,
      status: subscription.status,
      stripeCustomerId: subscription.props.stripeCustomerId,
      stripeSubscriptionId: subscription.props.stripeSubscriptionId,
      stripePriceId: subscription.props.stripePriceId,
      billingCycle: subscription.props.billingCycle,
      currentPeriodStart: subscription.props.currentPeriodStart,
      currentPeriodEnd: subscription.props.currentPeriodEnd,
      cancelledAt: subscription.props.cancelledAt,
      cancelAtPeriodEnd: subscription.props.cancelAtPeriodEnd,
    };

    const record = await this.prisma.subscription.update({
      where: { userId: subscription.userId.value },
      data,
    });

    return this.toDomain(record);
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.subscription.delete({
      where: { userId },
    });
  }

  async getUsageRecord(
    userId: string,
    period: string
  ): Promise<{ examsCreated: number } | null> {
    const record = await this.prisma.usageRecord.findUnique({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
    });

    if (!record) return null;

    return { examsCreated: record.examsCreated };
  }

  async upsertUsageRecord(
    userId: string,
    period: string,
    examsCreated: number
  ): Promise<void> {
    await this.prisma.usageRecord.upsert({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      update: {
        examsCreated,
      },
      create: {
        userId,
        period,
        examsCreated,
      },
    });
  }

  async incrementExamCount(userId: string, period: string): Promise<number> {
    // Use upsert to create or update the usage record
    const result = await this.prisma.usageRecord.upsert({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      update: {
        examsCreated: {
          increment: 1,
        },
      },
      create: {
        userId,
        period,
        examsCreated: 1,
      },
    });

    return result.examsCreated;
  }

  /**
   * Maps Prisma Subscription record to domain Subscription entity
   */
  private toDomain(record: {
    id: string;
    userId: string;
    plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    billingCycle: 'MONTHLY' | 'YEARLY';
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelledAt: Date | null;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return Subscription.create({
      id: record.id,
      userId: record.userId,
      plan: record.plan,
      status: record.status,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      stripePriceId: record.stripePriceId,
      billingCycle: record.billingCycle,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelledAt: record.cancelledAt,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}