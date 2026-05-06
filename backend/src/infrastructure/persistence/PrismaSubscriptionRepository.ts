import type { PrismaClient } from '@prisma/client';

import { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
} from '@domain/entities/Subscription.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * PrismaSubscriptionRepository
 * Infrastructure implementation of ISubscriptionRepository using Prisma ORM
 */
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  private constructor(private readonly prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaSubscriptionRepository {
    return new PrismaSubscriptionRepository(prismaClient);
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const data = subscription.toObject();

    const created = await this.prisma.subscription.create({
      data: {
        id: data.id,
        teacherId: data.teacherId,
        tier: data.tier,
        billingCycle: data.billingCycle,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: SubscriptionId): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: id.value },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async findByTeacherId(teacherId: UserId, tx?: any): Promise<Subscription | null> {
    const prisma = tx || this.prisma;
    const subscription = await prisma.subscription.findUnique({
      where: { teacherId: teacherId.value },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const data = subscription.toObject();

    const updated = await this.prisma.subscription.update({
      where: { id: data.id },
      data: {
        tier: data.tier,
        billingCycle: data.billingCycle,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToEntity(updated);
  }

  async updateStatus(id: SubscriptionId, status: SubscriptionStatus): Promise<void> {
    await this.prisma.subscription.update({
      where: { id: id.value },
      data: { status },
    });
  }

  async markForCancellation(id: SubscriptionId): Promise<void> {
    await this.prisma.subscription.update({
      where: { id: id.value },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async revertCancellation(id: SubscriptionId): Promise<void> {
    await this.prisma.subscription.update({
      where: { id: id.value },
      data: { cancelAtPeriodEnd: false, status: 'ACTIVE' },
    });
  }

  async findSubscriptionsToDowngrade(): Promise<Subscription[]> {
    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lte: now },
        status: 'ACTIVE',
      },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  async findPastDueSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
      },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async delete(id: SubscriptionId): Promise<void> {
    await this.prisma.subscription.delete({
      where: { id: id.value },
    });
  }

  async countByTier(tier: SubscriptionTier): Promise<number> {
    return this.prisma.subscription.count({
      where: { tier },
    });
  }

  async findByTier(tier: SubscriptionTier): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { tier },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  private mapToEntity(record: {
    id: string;
    teacherId: string;
    tier: string;
    billingCycle: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(record.id),
      teacherId: UserId.create(record.teacherId),
      tier: record.tier as SubscriptionTier,
      billingCycle: record.billingCycle as BillingCycle,
      status: record.status as SubscriptionStatus,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      stripeSubscriptionId: record.stripeSubscriptionId ?? undefined,
      stripeCustomerId: record.stripeCustomerId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
