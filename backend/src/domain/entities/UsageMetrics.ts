import { SubscriptionId } from '@domain/value-objects/SubscriptionId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface UsageMetricsProps {
  id: string;
  teacherId: UserId;
  subscriptionId: SubscriptionId;
  period: Date; // YYYY-MM-01 format
  currentClasses: number;
  currentStudents: number;
  examsCreatedThisMonth: number;
  examsCreatedTotal: number;
  peakConcurrentStudents: number;
  avgExamsPerMonth: number;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * UsageMetrics Entity
 * Tracks usage metrics for a teacher's subscription
 * Period is month-based (YYYY-MM-01) to track monthly limits
 */
export class UsageMetrics {
  private constructor(private props: UsageMetricsProps) {}

  static create(props: UsageMetricsProps): UsageMetrics {
    // Validation
    if (props.currentClasses < 0) {
      throw new Error('currentClasses must be >= 0');
    }
    if (props.currentStudents < 0) {
      throw new Error('currentStudents must be >= 0');
    }
    if (props.examsCreatedThisMonth < 0) {
      throw new Error('examsCreatedThisMonth must be >= 0');
    }
    if (props.examsCreatedTotal < 0) {
      throw new Error('examsCreatedTotal must be >= 0');
    }

    // Period must be first day of month
    const periodDate = new Date(props.period);
    if (periodDate.getDate() !== 1) {
      throw new Error('Period must be the first day of the month');
    }

    return new UsageMetrics(props);
  }

  static createInitial(teacherId: UserId, subscriptionId: SubscriptionId): UsageMetrics {
    const now = new Date();
    // Set period to first day of current month
    const period = new Date(now.getFullYear(), now.getMonth(), 1);

    return UsageMetrics.create({
      id: crypto.randomUUID(),
      teacherId,
      subscriptionId,
      period,
      currentClasses: 0,
      currentStudents: 0,
      examsCreatedThisMonth: 0,
      examsCreatedTotal: 0,
      peakConcurrentStudents: 0,
      avgExamsPerMonth: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get teacherId(): UserId {
    return this.props.teacherId;
  }

  get subscriptionId(): SubscriptionId {
    return this.props.subscriptionId;
  }

  get period(): Date {
    return this.props.period;
  }

  get currentClasses(): number {
    return this.props.currentClasses;
  }

  get currentStudents(): number {
    return this.props.currentStudents;
  }

  get examsCreatedThisMonth(): number {
    return this.props.examsCreatedThisMonth;
  }

  get examsCreatedTotal(): number {
    return this.props.examsCreatedTotal;
  }

  get peakConcurrentStudents(): number {
    return this.props.peakConcurrentStudents;
  }

  get avgExamsPerMonth(): number {
    return this.props.avgExamsPerMonth;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  /**
   * Check if this metrics record is for the current month
   */
  isCurrentMonth(): boolean {
    const now = new Date();
    const nowPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.props.period.getTime() === nowPeriod.getTime();
  }

  /**
   * Create a new metrics record for the next month (resetting monthly counters)
   */
  createForNextMonth(): UsageMetrics {
    const nextPeriod = new Date(this.props.period);
    nextPeriod.setMonth(nextPeriod.getMonth() + 1);

    // Calculate avg exams per month
    const monthsSinceStart =
      Math.floor(
        (new Date().getTime() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ) + 1;
    const avgExamsPerMonth = this.props.examsCreatedTotal / monthsSinceStart;

    return UsageMetrics.create({
      id: crypto.randomUUID(),
      teacherId: this.props.teacherId,
      subscriptionId: this.props.subscriptionId,
      period: nextPeriod,
      currentClasses: this.props.currentClasses,
      currentStudents: this.props.currentStudents,
      examsCreatedThisMonth: 0,
      examsCreatedTotal: this.props.examsCreatedTotal,
      peakConcurrentStudents: this.props.peakConcurrentStudents,
      avgExamsPerMonth,
      createdAt: this.props.createdAt,
      updatedAt: new Date(),
    });
  }

  incrementClassCount(): UsageMetrics {
    return new UsageMetrics({
      ...this.props,
      currentClasses: this.props.currentClasses + 1,
      updatedAt: new Date(),
    });
  }

  decrementClassCount(): UsageMetrics {
    return new UsageMetrics({
      ...this.props,
      currentClasses: Math.max(0, this.props.currentClasses - 1),
      updatedAt: new Date(),
    });
  }

  incrementStudentCount(count: number = 1): UsageMetrics {
    const newCount = this.props.currentStudents + count;
    // Update peak if this is the new high
    const newPeak = Math.max(this.props.peakConcurrentStudents, newCount);

    return new UsageMetrics({
      ...this.props,
      currentStudents: newCount,
      peakConcurrentStudents: newPeak,
      updatedAt: new Date(),
    });
  }

  decrementStudentCount(count: number = 1): UsageMetrics {
    return new UsageMetrics({
      ...this.props,
      currentStudents: Math.max(0, this.props.currentStudents - count),
      updatedAt: new Date(),
    });
  }

  incrementExamCount(): UsageMetrics {
    return new UsageMetrics({
      ...this.props,
      examsCreatedThisMonth: this.props.examsCreatedThisMonth + 1,
      examsCreatedTotal: this.props.examsCreatedTotal + 1,
      updatedAt: new Date(),
    });
  }

  updateClassCount(count: number): UsageMetrics {
    if (count < 0) {
      throw new Error('Class count must be >= 0');
    }
    return new UsageMetrics({
      ...this.props,
      currentClasses: count,
      updatedAt: new Date(),
    });
  }

  updateStudentCount(count: number): UsageMetrics {
    if (count < 0) {
      throw new Error('Student count must be >= 0');
    }

    const newPeak = Math.max(this.props.peakConcurrentStudents, count);

    return new UsageMetrics({
      ...this.props,
      currentStudents: count,
      peakConcurrentStudents: newPeak,
      updatedAt: new Date(),
    });
  }

  toObject() {
    return {
      id: this.props.id,
      teacherId: this.props.teacherId.value,
      subscriptionId: this.props.subscriptionId.value,
      period: this.props.period,
      currentClasses: this.props.currentClasses,
      currentStudents: this.props.currentStudents,
      examsCreatedThisMonth: this.props.examsCreatedThisMonth,
      examsCreatedTotal: this.props.examsCreatedTotal,
      peakConcurrentStudents: this.props.peakConcurrentStudents,
      avgExamsPerMonth: this.props.avgExamsPerMonth,
      updatedAt: this.props.updatedAt,
      createdAt: this.props.createdAt,
    };
  }
}
