import type { UsageMetrics } from '@domain/entities/UsageMetrics.js';
import type { UserId } from '@domain/value-objects/UserId.js';
import type { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';

/**
 * Repository interface for UsageMetrics entity
 */
export interface IUsageMetricsRepository {
  /**
   * Create new usage metrics
   */
  create(metrics: UsageMetrics): Promise<UsageMetrics>;

  /**
   * Find usage metrics by ID
   */
  findById(id: string): Promise<UsageMetrics | null>;

  /**
   * Find current month usage metrics for a teacher
   */
  findCurrentByTeacherId(teacherId: UserId): Promise<UsageMetrics | null>;

  /**
   * Find usage metrics by teacher ID and period
   */
  findByTeacherIdAndPeriod(teacherId: UserId, period: Date): Promise<UsageMetrics | null>;

  /**
   * Update usage metrics
   */
  update(metrics: UsageMetrics): Promise<UsageMetrics>;

  /**
   * Get or create current month usage metrics for a teacher
   */
  getOrCreateCurrent(teacherId: UserId, subscriptionId: SubscriptionId): Promise<UsageMetrics>;

  /**
   * Increment class count
   */
  incrementClassCount(id: string): Promise<void>;

  /**
   * Decrement class count
   */
  decrementClassCount(id: string): Promise<void>;

  /**
   * Increment student count
   */
  incrementStudentCount(id: string, count?: number): Promise<void>;

  /**
   * Decrement student count
   */
  decrementStudentCount(id: string, count?: number): Promise<void>;

  /**
   * Increment exam count
   */
  incrementExamCount(id: string): Promise<void>;

  /**
   * Update class count to specific value
   */
  updateClassCount(id: string, count: number): Promise<void>;

  /**
   * Update student count to specific value
   */
  updateStudentCount(id: string, count: number): Promise<void>;

  /**
   * Find all metrics for teachers that need monthly reset
   * (Free tier users with old metrics from previous month)
   */
  findMetricsNeedingReset(): Promise<UsageMetrics[]>;

  /**
   * Delete metrics by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all metrics for a teacher
   */
  deleteByTeacherId(teacherId: UserId): Promise<void>;

  /**
   * Get metrics history for a teacher (paginated)
   */
  getHistory(
    teacherId: UserId,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<UsageMetrics[]>;

  /**
   * Get total count of metrics for a teacher
   */
  countByTeacherId(teacherId: UserId): Promise<number>;
}
