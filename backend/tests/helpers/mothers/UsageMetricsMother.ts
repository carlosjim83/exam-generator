/**
 * UsageMetrics Mother Object
 * Factory for creating test UsageMetrics entities
 */
import { UsageMetrics } from '@domain/entities/UsageMetrics.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';

export class UsageMetricsMother {
  /**
   * Create initial usage metrics with zero counts
   */
  static createInitial(
    overrides: Partial<{
      id: string;
      teacherId: string;
      subscriptionId: string;
    }> = {}
  ): UsageMetrics {
    return UsageMetrics.create({
      id: overrides.id ?? '123e4567-e89b-42d3-a456-426614174010',
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      subscriptionId: SubscriptionId.create(
        overrides.subscriptionId ?? '123e4567-e89b-42d3-a456-426614174000'
      ),
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: 0,
      currentStudents: 0,
      examsCreatedThisMonth: 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 0,
      avgExamsPerMonth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create metrics for a FREE tier user at class limit (1 class)
   */
  static createAtClassLimit(
    overrides: Partial<{
      id: string;
      teacherId: string;
      subscriptionId: string;
    }> = {}
  ): UsageMetrics {
    return UsageMetrics.create({
      id: overrides.id ?? '123e4567-e89b-42d3-a456-426614174011',
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      subscriptionId: SubscriptionId.create(
        overrides.subscriptionId ?? '123e4567-e89b-42d3-a456-426614174000'
      ),
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: 1, // At FREE tier limit
      currentStudents: 0,
      examsCreatedThisMonth: 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 0,
      avgExamsPerMonth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create metrics for a FREE tier user at student limit (30 students)
   */
  static createAtStudentLimit(
    overrides: Partial<{
      id: string;
      teacherId: string;
      subscriptionId: string;
    }> = {}
  ): UsageMetrics {
    return UsageMetrics.create({
      id: overrides.id ?? '123e4567-e89b-42d3-a456-426614174012',
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      subscriptionId: SubscriptionId.create(
        overrides.subscriptionId ?? '123e4567-e89b-42d3-a456-426614174000'
      ),
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: 1,
      currentStudents: 30, // At FREE tier limit
      examsCreatedThisMonth: 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 30,
      avgExamsPerMonth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create metrics for a FREE tier user at exam limit (10 exams/month)
   */
  static createAtExamLimit(
    overrides: Partial<{
      id: string;
      teacherId: string;
      subscriptionId: string;
    }> = {}
  ): UsageMetrics {
    return UsageMetrics.create({
      id: overrides.id ?? '123e4567-e89b-42d3-a456-426614174013',
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      subscriptionId: SubscriptionId.create(
        overrides.subscriptionId ?? '123e4567-e89b-42d3-a456-426614174000'
      ),
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: 1,
      currentStudents: 15,
      examsCreatedThisMonth: 10, // At FREE tier limit
      examsCreatedTotal: 25,
      peakConcurrentStudents: 15,
      avgExamsPerMonth: 8.3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create metrics with custom values
   */
  static createWith(overrides: {
    currentClasses?: number;
    currentStudents?: number;
    examsCreatedThisMonth?: number;
    teacherId?: string;
    subscriptionId?: string;
  }): UsageMetrics {
    return UsageMetrics.create({
      id: '123e4567-e89b-42d3-a456-426614174014',
      teacherId: UserId.create(overrides.teacherId ?? '123e4567-e89b-42d3-a456-426614174001'),
      subscriptionId: SubscriptionId.create(
        overrides.subscriptionId ?? '123e4567-e89b-42d3-a456-426614174000'
      ),
      period: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      currentClasses: overrides.currentClasses ?? 0,
      currentStudents: overrides.currentStudents ?? 0,
      examsCreatedThisMonth: overrides.examsCreatedThisMonth ?? 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 0,
      avgExamsPerMonth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
