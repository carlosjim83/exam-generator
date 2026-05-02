import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import type { ILogger } from '@domain/services/ILogger.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface IUsageMetricsUpdater {
  updateExamCount(teacherId: string): Promise<void>;
}

/**
 * UsageMetricsUpdater
 * Updates usage metrics after business operations.
 * Failures are logged but not thrown (metrics are non-critical).
 */
export class UsageMetricsUpdater implements IUsageMetricsUpdater {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly usageMetricsRepository: IUsageMetricsRepository,
    private readonly logger: ILogger
  ) {}

  async updateExamCount(teacherId: string): Promise<void> {
    try {
      const teacherUserId = UserId.create(teacherId);
      const subscription = await this.subscriptionRepository.findByTeacherId(teacherUserId);

      if (subscription) {
        const metrics = await this.usageMetricsRepository.getOrCreateCurrent(
          teacherUserId,
          subscription.id
        );
        await this.usageMetricsRepository.incrementExamCount(metrics.id);
        return;
      }

      const existingMetrics =
        await this.usageMetricsRepository.findCurrentByTeacherId(teacherUserId);
      if (!existingMetrics) {
        this.logger.warn('No usage metrics found for teacher', { teacherId });
        return;
      }

      await this.usageMetricsRepository.incrementExamCount(existingMetrics.id);
    } catch (error) {
      this.logger.error('Failed to update exam usage metrics', {
        teacherId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
