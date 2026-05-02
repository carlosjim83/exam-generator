import { FREE_TIER_LIMITS, LIMIT_ERRORS } from '@config/subscription-limits.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { SubscriptionLimits } from '@domain/entities/SubscriptionLimits.js';
import { NotFoundError, ConflictError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
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
    private readonly usageMetricsRepository: IUsageMetricsRepository
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
    if (!subscription) {
      // Free tier by default, check usage
      await this.checkFreeTierLimit(teacherId);
      return;
    }

    // Get limits for current tier
    const limits = SubscriptionLimits.getForTier(subscription.tier);

    // If unlimited, skip check
    if (!limits.hasStudentLimit()) {
      return;
    }

    // Get current usage
    const usageMetrics = await this.usageMetricsRepository.findCurrentByTeacherId(teacherId);
    if (!usageMetrics) {
      // No metrics yet, allow creation (will be created on first action)
      return;
    }

    // Check if can add student
    if (!limits.canAddStudent(usageMetrics.currentStudents)) {
      const errorMessage =
        subscription.tier === 'FREE'
          ? LIMIT_ERRORS.STUDENT_LIMIT.FREE
          : LIMIT_ERRORS.STUDENT_LIMIT.PRO;

      throw new ConflictError(errorMessage);
    }
  }

  /**
   * Check Free tier limit (30 students maximum)
   */
  private async checkFreeTierLimit(teacherId: UserId): Promise<void> {
    const totalStudents = await this.enrollmentRepository.countTotalByTeacherId(teacherId);

    if (totalStudents >= FREE_TIER_LIMITS.MAX_STUDENTS) {
      throw new ConflictError(LIMIT_ERRORS.STUDENT_LIMIT.FREE);
    }
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
