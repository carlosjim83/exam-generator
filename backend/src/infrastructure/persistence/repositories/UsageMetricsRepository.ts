import { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import type { UsageMetrics } from '@domain/entities/UsageMetrics.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { prisma } from '@config/prisma.js';

/**
 * Prisma implementation of IUsageMetricsRepository
 */
export class UsageMetricsRepository implements IUsageMetricsRepository {
  async create(metrics: UsageMetrics): Promise<UsageMetrics> {
    const data = metrics.toObject();

    const created = await prisma.usageMetrics.create({
      data: {
        id: data.id,
        teacherId: data.teacherId,
        subscriptionId: data.subscriptionId,
        period: data.period,
        currentClasses: data.currentClasses,
        currentStudents: data.currentStudents,
        examsCreatedThisMonth: data.examsCreatedThisMonth,
        examsCreatedTotal: data.examsCreatedTotal,
        peakConcurrentStudents: data.peakConcurrentStudents,
        avgExamsPerMonth: data.avgExamsPerMonth,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<UsageMetrics | null> {
    const metrics = await prisma.usageMetrics.findUnique({
      where: { id },
    });

    if (!metrics) {
      return null;
    }

    return this.mapToEntity(metrics);
  }

  async findCurrentByTeacherId(teacherId: UserId): Promise<UsageMetrics | null> {
    const now = new Date();
    const period = new Date(now.getFullYear(), now.getMonth(), 1);

    const metrics = await prisma.usageMetrics.findFirst({
      where: {
        teacherId: teacherId.value,
        period,
      },
    });

    if (!metrics) {
      return null;
    }

    return this.mapToEntity(metrics);
  }

  async findByTeacherIdAndPeriod(teacherId: UserId, period: Date): Promise<UsageMetrics | null> {
    const metrics = await prisma.usageMetrics.findFirst({
      where: {
        teacherId: teacherId.value,
        period,
      },
    });

    if (!metrics) {
      return null;
    }

    return this.mapToEntity(metrics);
  }

  async update(metrics: UsageMetrics): Promise<UsageMetrics> {
    const data = metrics.toObject();

    const updated = await prisma.usageMetrics.update({
      where: { id: data.id },
      data: {
        currentClasses: data.currentClasses,
        currentStudents: data.currentStudents,
        examsCreatedThisMonth: data.examsCreatedThisMonth,
        examsCreatedTotal: data.examsCreatedTotal,
        peakConcurrentStudents: data.peakConcurrentStudents,
        avgExamsPerMonth: data.avgExamsPerMonth,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToEntity(updated);
  }

  async getOrCreateCurrent(
    teacherId: UserId,
    subscriptionId: SubscriptionId
  ): Promise<UsageMetrics> {
    const existing = await this.findCurrentByTeacherId(teacherId);

    if (existing) {
      return existing;
    }

    const newMetrics = UsageMetrics.createInitial(teacherId, subscriptionId);
    return await this.create(newMetrics);
  }

  async incrementClassCount(id: string): Promise<void> {
    await prisma.usageMetrics.update({
      where: { id },
      data: {
        currentClasses: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async decrementClassCount(id: string): Promise<void> {
    await prisma.usageMetrics.updateMany({
      where: { id },
      data: {
        currentClasses: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async incrementStudentCount(id: string, count: number = 1): Promise<void> {
    const metrics = await prisma.usageMetrics.findUnique({ where: { id } });
    if (!metrics) return;

    await prisma.usageMetrics.update({
      where: { id },
      data: {
        currentStudents: { increment: count },
        peakConcurrentStudents: Math.max(
          metrics.peakConcurrentStudents,
          metrics.currentStudents + count
        ),
        updatedAt: new Date(),
      },
    });
  }

  async decrementStudentCount(id: string, count: number = 1): Promise<void> {
    await prisma.usageMetrics.updateMany({
      where: { id, currentStudents: { gte: count } },
      data: {
        currentStudents: { decrement: count },
        updatedAt: new Date(),
      },
    });
  }

  async incrementExamCount(id: string): Promise<void> {
    await prisma.usageMetrics.update({
      where: { id },
      data: {
        examsCreatedThisMonth: { increment: 1 },
        examsCreatedTotal: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async updateClassCount(id: string, count: number): Promise<void> {
    await prisma.usageMetrics.update({
      where: { id },
      data: {
        currentClasses: count,
        updatedAt: new Date(),
      },
    });
  }

  async updateStudentCount(id: string, count: number): Promise<void> {
    const metrics = await prisma.usageMetrics.findUnique({ where: { id } });
    if (!metrics) return;

    await prisma.usageMetrics.update({
      where: { id },
      data: {
        currentStudents: count,
        peakConcurrentStudents:
          metrics.peakConcurrentStudents >= count ? metrics.peakConcurrentStudents : count,
        updatedAt: new Date(),
      },
    });
  }

  async findMetricsNeedingReset(): Promise<UsageMetrics[]> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Find all metrics that are not from current month
    const allMetrics = await prisma.usageMetrics.findMany({
      where: {
        period: { lt: currentMonth },
      },
    });

    // Filter to only Free tier teachers (we can determine this via subscription if needed)
    // For now, return all old metrics
    return allMetrics.map((m) => this.mapToEntity(m));
  }

  async delete(id: string): Promise<void> {
    await prisma.usageMetrics.delete({
      where: { id },
    });
  }

  async deleteByTeacherId(teacherId: UserId): Promise<void> {
    await prisma.usageMetrics.deleteMany({
      where: { teacherId: teacherId.value },
    });
  }

  async getHistory(
    teacherId: UserId,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<UsageMetrics[]> {
    const { limit = 50, offset = 0, fromDate, toDate } = options || {};

    const where: any = {
      teacherId: teacherId.value,
    };

    if (fromDate) {
      where.period = { ...where.period, gte: fromDate };
    }

    if (toDate) {
      where.period = { ...where.period, lte: toDate };
    }

    const metrics = await prisma.usageMetrics.findMany({
      where,
      orderBy: { period: 'desc' },
      take: limit,
      skip: offset,
    });

    return metrics.map((m) => this.mapToEntity(m));
  }

  async countByTeacherId(teacherId: UserId): Promise<number> {
    return prisma.usageMetrics.count({
      where: { teacherId: teacherId.value },
    });
  }

  private mapToEntity(prismaMetrics: any): UsageMetrics {
    return UsageMetrics.create({
      id: prismaMetrics.id,
      teacherId: UserId.create(prismaMetrics.teacherId),
      subscriptionId: SubscriptionId.create(prismaMetrics.subscriptionId),
      period: prismaMetrics.period,
      currentClasses: prismaMetrics.currentClasses,
      currentStudents: prismaMetrics.currentStudents,
      examsCreatedThisMonth: prismaMetrics.examsCreatedThisMonth,
      examsCreatedTotal: prismaMetrics.examsCreatedTotal,
      peakConcurrentStudents: prismaMetrics.peakConcurrentStudents,
      avgExamsPerMonth: Number(prismaMetrics.avgExamsPerMonth),
      createdAt: prismaMetrics.createdAt,
      updatedAt: prismaMetrics.updatedAt,
    });
  }
}
