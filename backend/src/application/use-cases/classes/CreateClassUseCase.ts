import { Class } from '@domain/entities/Class.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class CreateClassCommand {
  constructor(
    public teacherId: string,
    public name: string,
    public description?: string,
    public color?: string
  ) {}
}

export class CreateClassUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly usageMetricsRepository: IUsageMetricsRepository,
    private readonly subscriptionEnforcementService: SubscriptionEnforcementService
  ) {}

  async execute(command: CreateClassCommand): Promise<Class> {
    // Check subscription limits
    await this.subscriptionEnforcementService.checkClassLimit(
      command.teacherId,
      this.subscriptionRepository,
      this.usageMetricsRepository
    );

    // Generate unique class code
    let code: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      code = this.generateClassCode();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique class code');
      }
    } while (await this.classRepository.existsByCode(code));

    const classEntity = new Class(
      new ClassId(),
      UserId.create(command.teacherId),
      command.name,
      code,
      command.description || null,
      command.color || null
    );

    await this.classRepository.save(classEntity);

    // Update usage metrics
    await this.updateUsageMetrics(command.teacherId);

    return classEntity;
  }

  /**
   * Update usage metrics to increment class count
   */
  private async updateUsageMetrics(teacherId: string): Promise<void> {
    try {
      const teacherUserId = UserId.create(teacherId);
      const subscription = await this.subscriptionRepository.findByTeacherId(teacherUserId);

      if (!subscription) {
        // No subscription yet, skip metric update
        return;
      }

      const usageMetrics = await this.usageMetricsRepository.getOrCreateCurrent(
        teacherUserId,
        subscription.id
      );

      await this.usageMetricsRepository.incrementClassCount(usageMetrics.id);
    } catch (error) {
      // Log error but don't fail class creation
      console.error('Failed to update class usage metrics:', error);
    }
  }

  private generateClassCode(): string {
    // Use uppercase letters and digits, excluding confusing chars (O, 0, I, 1)
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * validChars.length);
      code += validChars[randomIndex];
    }

    return code;
  }
}
