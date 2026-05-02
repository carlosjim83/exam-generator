import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { SubscriptionEnforcementService } from '@domain/services/SubscriptionEnforcementService.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class StudentJoinClassCommand {
  constructor(
    public classId: string,
    public studentId: string
  ) {}
}

export class StudentJoinClassUseCase {
  constructor(
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classRepository: IClassRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly usageMetricsRepository: IUsageMetricsRepository,
    private readonly subscriptionEnforcementService: SubscriptionEnforcementService
  ) {}

  async execute(command: StudentJoinClassCommand): Promise<StudentEnrollment> {
    const classId = new ClassId(command.classId);
    const studentId = UserId.create(command.studentId);

    // Find the class
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findByClassAndStudent(
      classId,
      studentId
    );
    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new ConflictError('Already enrolled in this class');
      }

      // Re-enroll (reactivate)
      const reactivatedEnrollment = new StudentEnrollment(
        existingEnrollment.id,
        classId,
        studentId,
        existingEnrollment.joinedAt,
        null,
        true
      );

      await this.enrollmentRepository.save(reactivatedEnrollment);
      return reactivatedEnrollment;
    }

    // Check subscription limits
    await this.enforceStudentLimit(classEntity.teacherId);

    // Create new enrollment
    const enrollment = new StudentEnrollment(
      new EnrollmentId(),
      classId,
      studentId,
      new Date(),
      null,
      true
    );

    await this.enrollmentRepository.save(enrollment);

    // Update usage metrics
    await this.updateUsageMetrics(classEntity.teacherId);

    return enrollment;
  }

  /**
   * Enforce student limit based on subscription tier
   */
  private async enforceStudentLimit(teacherId: UserId): Promise<void> {
    // Get subscription
    const subscription = await this.subscriptionRepository.findByTeacherId(teacherId);
    const tier = subscription?.tier ?? SubscriptionTier.FREE;

    // Get current usage
    let currentStudents: number;
    if (subscription) {
      const usageMetrics = await this.usageMetricsRepository.findCurrentByTeacherId(teacherId);
      currentStudents = usageMetrics?.currentStudents ?? 0;
    } else {
      currentStudents = (await this.enrollmentRepository.countTotalByTeacherId(teacherId)) ?? 0;
    }

    this.subscriptionEnforcementService.enforceStudentLimit(currentStudents, tier);
  }

  /**
   * Update usage metrics to increment student count
   */
  private async updateUsageMetrics(teacherId: UserId): Promise<void> {
    try {
      const subscription = await this.subscriptionRepository.findByTeacherId(teacherId);

      if (!subscription) {
        // No subscription yet, skip metric update
        return;
      }

      const usageMetrics = await this.usageMetricsRepository.getOrCreateCurrent(
        teacherId,
        subscription.id
      );

      await this.usageMetricsRepository.incrementStudentCount(usageMetrics.id);
    } catch (error) {
      // Log error but don't fail enrollment
      console.error('Failed to update student usage metrics:', error);
    }
  }
}
