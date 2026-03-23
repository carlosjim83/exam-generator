import { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { Subscription } from '@domain/entities/Subscription.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionTier, SubscriptionStatus } from '@domain/entities/Subscription.js';
import { prisma } from '@config/prisma.js';
import { Subscription as PrismaSubscription } from '@prisma/client';

/**
 * Prisma implementation of ISubscriptionRepository
 */
export class SubscriptionRepository implements ISubscriptionRepository {
  async create(subscription: Subscription): Promise<Subscription> {
    const data = subscription.toObject();

    const created = await prisma.subscription.create({
      data: {
        id: data.id,
        teacherId: data.teacherId,
        tier: SubscriptionTier[data.tier as keyof typeof SubscriptionTier],
        billingCycle: data.billingCycle,
        status: SubscriptionStatus[data.status as keyof typeof SubscriptionStatus],
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
    const subscription = await prisma.subscription.findUnique({
      where: { id: id.value },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async findByTeacherId(teacherId: UserId): Promise<Subscription | null> {
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

    const updated = await prisma.subscription.update({
      where: { id: data.id },
      data: {
        tier: SubscriptionTier[data.tier as keyof typeof SubscriptionTier],
        billingCycle: data.billingCycle,
        status: SubscriptionStatus[data.status as keyof typeof SubscriptionStatus],
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
    await prisma.subscription.update({
      where: { id: id.value },
      data: { status: SubscriptionStatus[status as keyof typeof SubscriptionStatus] },
    });
  }

  async markForCancellation(id: SubscriptionId): Promise<void> {
    await prisma.subscription.update({
      where: { id: id.value },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async revertCancellation(id: SubscriptionId): Promise<void> {
    await prisma.subscription.update({
      where: { id: id.value },
      data: { cancelAtPeriodEnd: false, status: SubscriptionStatus.ACTIVE },
    });
  }

  async findSubscriptionsToDowngrade(): Promise<Subscription[]> {
    const now = new Date();

    const subscriptions = await prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lte: now },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  async findPastDueSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (!subscription) {
      return null;
    }

    return this.mapToEntity(subscription);
  }

  async delete(id: SubscriptionId): Promise<void> {
    await prisma.subscription.delete({
      where: { id: id.value },
    });
  }

  async countByTier(tier: SubscriptionTier): Promise<number> {
    return prisma.subscription.count({
      where: { tier: SubscriptionTier[tier as keyof typeof SubscriptionTier] },
    });
  }

  async findByTier(tier: SubscriptionTier): Promise<Subscription[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { tier: SubscriptionTier[tier as keyof typeof SubscriptionTier] },
    });

    return subscriptions.map((s) => this.mapToEntity(s));
  }

  private mapToEntity(prismaSubscription: any): Subscription {
    return Subscription.create({
      id: SubscriptionId.create(prismaSubscription.id),
      teacherId: UserId.create(prismaSubscription.teacherId),
      tier: SubscriptionTier[prismaSubscription.tier as keyof typeof SubscriptionTier],
      billingCycle: prismaSubscription.billingCycle,
      status: SubscriptionStatus[prismaSubscription.status as keyof typeof SubscriptionStatus],
      currentPeriodStart: prismaSubscription.currentPeriodStart,
      currentPeriodEnd: prismaSubscription.currentPeriodEnd,
      cancelAtPeriodEnd: prismaSubscription.cancelAtPeriodEnd,
      stripeSubscriptionId: prismaSubscription.stripeSubscriptionId,
      stripeCustomerId: prismaSubscription.stripeCustomerId,
      createdAt: prismaSubscription.createdAt,
      updatedAt: prismaSubscription.updatedAt,
    });
  }
}
