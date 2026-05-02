import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StudentJoinClassUseCase,
  StudentJoinClassCommand,
} from '@application/use-cases/classes/StudentJoinClassUseCase.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { SubscriptionTier } from '@domain/entities/Subscription.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository.js';
import type { IUsageMetricsRepository } from '@domain/repositories/IUsageMetricsRepository.js';
import { LIMIT_ERRORS } from '@config/subscription-limits.js';
import { SubscriptionMother } from '@tests/helpers/factories/SubscriptionMother.js';
import { UsageMetricsMother } from '@tests/helpers/factories/UsageMetricsMother.js';

// Mock repositories
const mockClassRepository = {
  findById: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

const mockEnrollmentRepository = {
  findByClassAndStudent: vi.fn(),
  save: vi.fn(),
  countTotalByTeacherId: vi.fn(),
} satisfies Partial<IStudentEnrollmentRepository> as IStudentEnrollmentRepository;

const mockSubscriptionRepository = {
  findByTeacherId: vi.fn(),
} satisfies Partial<ISubscriptionRepository> as ISubscriptionRepository;

const mockUsageMetricsRepository = {
  findCurrentByTeacherId: vi.fn(),
  getOrCreateCurrent: vi.fn(),
  incrementStudentCount: vi.fn(),
} satisfies Partial<IUsageMetricsRepository> as IUsageMetricsRepository;

describe('StudentJoinClassUseCase', () => {
  let useCase: StudentJoinClassUseCase;
  const classId = '123e4567-e89b-42d3-a456-426614174000';
  const studentId = '987e6543-e89b-42d3-a456-426614174888';
  const teacherId = '456e7890-e89b-42d3-a456-426614174999';

  beforeEach(() => {
    useCase = new StudentJoinClassUseCase(
      mockEnrollmentRepository,
      mockClassRepository,
      mockSubscriptionRepository,
      mockUsageMetricsRepository
    );
    vi.clearAllMocks();

    // Default: class exists
    vi.mocked(mockClassRepository.findById).mockResolvedValue({
      id: ClassId.create(classId),
      teacherId: UserId.create(teacherId),
      name: 'Test Class',
      code: 'ABC123',
      description: null,
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({
        id: classId,
        teacherId,
        name: 'Test Class',
        code: 'ABC123',
        description: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as any);

    // Default: no subscription (Free tier)
    vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);
    vi.mocked(mockUsageMetricsRepository.findCurrentByTeacherId).mockResolvedValue(null);
  });

  describe('execute', () => {
    it('should create new enrollment for student', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(StudentEnrollment);
      expect(result.isActive).toBe(true);
      expect(result.leftAt).toBeNull();
      expect(result.joinedAt).toBeInstanceOf(Date);
      expect(mockEnrollmentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when class not found', async () => {
      vi.mocked(mockClassRepository.findById).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await expect(useCase.execute(command)).rejects.toThrow('Class not found');
      expect(mockEnrollmentRepository.findByClassAndStudent).not.toHaveBeenCalled();
    });

    it('should throw error when student already enrolled', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue({
        id: 'enrollment-1',
        classId: ClassId.create(classId),
        studentId: UserId.create(studentId),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      } as any);

      const command = new StudentJoinClassCommand(classId, studentId);

      await expect(useCase.execute(command)).rejects.toThrow('Already enrolled in this class');
      expect(mockEnrollmentRepository.save).not.toHaveBeenCalled();
    });

    it('should reactivate inactive enrollment', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue({
        id: 'enrollment-1',
        classId: ClassId.create(classId),
        studentId: UserId.create(studentId),
        isActive: false,
        joinedAt: new Date('2024-01-01'),
        leftAt: new Date('2024-01-15'),
      } as any);

      const command = new StudentJoinClassCommand(classId, studentId);

      const result = await useCase.execute(command);

      expect(result.isActive).toBe(true);
      expect(result.leftAt).toBeNull();
      expect(mockEnrollmentRepository.save).toHaveBeenCalledWith(result);
    });

    describe('subscription limits', () => {
      it('should enforce FREE tier student limit (30 students)', async () => {
        vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);
        vi.mocked(mockEnrollmentRepository.countTotalByTeacherId).mockResolvedValue(30); // Already at limit

        const command = new StudentJoinClassCommand(classId, studentId);

        await expect(useCase.execute(command)).rejects.toThrow(LIMIT_ERRORS.STUDENT_LIMIT.FREE);
      });

      it('should allow student enrollment when under FREE tier limit', async () => {
        vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);
        vi.mocked(mockEnrollmentRepository.countTotalByTeacherId).mockResolvedValue(29); // Under limit
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          UsageMetricsMother.createInitial({ teacherId })
        );

        const command = new StudentJoinClassCommand(classId, studentId);

        const result = await useCase.execute(command);

        expect(result).toBeInstanceOf(StudentEnrollment);
        expect(result.isActive).toBe(true);
      });

      it('should allow PRO tier unlimited students', async () => {
        const mockSubscription = SubscriptionMother.createPro({ teacherId });
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(mockSubscription);
        vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);
        vi.mocked(mockEnrollmentRepository.countTotalByTeacherId).mockResolvedValue(100); // Already has many students

        const command = new StudentJoinClassCommand(classId, studentId);

        const result = await useCase.execute(command);

        expect(result).toBeInstanceOf(StudentEnrollment);
        expect(mockEnrollmentRepository.save).toHaveBeenCalled();
      });

      it('should increment student count after successful enrollment for PRO tier', async () => {
        // PRO tier: subscription exists, metrics should be updated
        const mockSubscription = SubscriptionMother.createPro({ teacherId });
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(mockSubscription);
        vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);
        vi.mocked(mockEnrollmentRepository.countTotalByTeacherId).mockResolvedValue(10);
        vi.mocked(mockUsageMetricsRepository.getOrCreateCurrent).mockResolvedValue(
          UsageMetricsMother.createInitial({ teacherId })
        );

        const command = new StudentJoinClassCommand(classId, studentId);

        await useCase.execute(command);

        expect(mockUsageMetricsRepository.incrementStudentCount).toHaveBeenCalled();
      });

      it('should NOT increment student count for FREE tier without subscription record', async () => {
        // FREE tier without subscription record in DB (default state)
        // Metrics update is skipped because there's no subscription to get the ID from
        vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);
        vi.mocked(mockEnrollmentRepository.countTotalByTeacherId).mockResolvedValue(0);
        // Default: no subscription found
        vi.mocked(mockSubscriptionRepository.findByTeacherId).mockResolvedValue(null);

        const command = new StudentJoinClassCommand(classId, studentId);

        await useCase.execute(command);

        // For FREE tier without subscription record, metrics are NOT updated
        // (subscription is created on-demand by GetSubscriptionUseCase)
        expect(mockUsageMetricsRepository.incrementStudentCount).not.toHaveBeenCalled();
      });
    });

    it('should create enrollment with null leftAt for new enrollments', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.leftAt).toBeNull();
    });

    it('should create enrollment with isActive true for new enrollments', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.isActive).toBe(true);
    });
  });

  describe('re-enrollment scenarios', () => {
    it('should create new enrollment with current date', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.joinedAt.getTime()).toBeCloseTo(Date.now(), -3);
    });

    it('should not allow re-enrollment with same classId and studentId if active', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockImplementation(async () => ({
        id: 'enrollment-1',
        classId: ClassId.create(classId),
        studentId: UserId.create(studentId),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      }));

      const command = new StudentJoinClassCommand(classId, studentId);

      await expect(useCase.execute(command)).rejects.toThrow('Already enrolled in this class');
    });
  });

  describe('repository interactions', () => {
    it('should call findByClassAndStudent before saving', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      expect(mockEnrollmentRepository.findByClassAndStudent).toHaveBeenCalledWith(
        expect.any(ClassId),
        expect.any(UserId)
      );
    });

    it('should use same classId and studentId for checking existing enrollment', async () => {
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const [foundClassId, foundStudentId] = vi.mocked(
        mockEnrollmentRepository.findByClassAndStudent
      ).mock.calls[0];

      expect(foundClassId.toString()).toBe(classId);
      expect(foundStudentId.toString()).toBe(studentId);
    });
  });
});
