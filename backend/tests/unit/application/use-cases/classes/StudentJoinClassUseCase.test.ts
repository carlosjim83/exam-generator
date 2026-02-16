import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  StudentJoinClassUseCase,
  StudentJoinClassCommand,
} from '@application/use-cases/classes/StudentJoinClassUseCase.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';

// Mock the repositories
const mockClassRepository = {
  findById: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

const mockEnrollmentRepository = {
  findByClassAndStudent: vi.fn(),
  save: vi.fn(),
} satisfies Partial<IStudentEnrollmentRepository> as IStudentEnrollmentRepository;

describe('StudentJoinClassUseCase', () => {
  let useCase: StudentJoinClassUseCase;
  const classId = '123e4567-e89b-42d3-a456-426614174000';
  const studentId = '987e6543-e89b-42d3-a456-426614174888';

  beforeEach(() => {
    useCase = new StudentJoinClassUseCase(mockEnrollmentRepository, mockClassRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create new enrollment for student', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
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
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);

      const mockEnrollment = {
        isActive: true,
        id: expect.anything(),
        classId: expect.anything(),
        studentId: expect.anything(),
      } as any;

      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(mockEnrollment);

      const command = new StudentJoinClassCommand(classId, studentId);

      await expect(useCase.execute(command)).rejects.toThrow('Already enrolled in this class');
      expect(mockEnrollmentRepository.save).not.toHaveBeenCalled();
    });

    it('should reactivate inactive enrollment', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);

      const mockPreviousEnrollment = {
        id: expect.anything(),
        classId: new ClassId(classId),
        studentId: UserId.create(studentId),
        isActive: false,
        joinedAt: new Date('2024-01-01'),
        leftAt: new Date('2024-01-15'),
      };

      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(
        mockPreviousEnrollment
      );

      const command = new StudentJoinClassCommand(classId, studentId);

      const result = await useCase.execute(command);

      expect(result.isActive).toBe(true);
      expect(result.leftAt).toBeNull();
      expect(mockEnrollmentRepository.save).toHaveBeenCalledWith(result);
    });

    it('should pass correct classId to new enrollment', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.classId.toString()).toBe(classId);
    });

    it('should pass correct studentId to new enrollment', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.studentId.toString()).toBe(studentId);
    });
  });

  describe('re-enrollment scenarios', () => {
    it('should create new enrollment with current date', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.joinedAt.getTime()).toBeCloseTo(Date.now(), -3);
    });

    it('should not allow re-enrollment with same classId and studentId if active', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);

      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockImplementation(
        async (_classId, _studentId) => ({
          id: expect.anything(),
          classId: _classId,
          studentId: _studentId,
          isActive: true,
          joinedAt: new Date(),
          leftAt: null,
        })
      );

      const command = new StudentJoinClassCommand(classId, studentId);

      await expect(useCase.execute(command)).rejects.toThrow('Already enrolled in this class');
    });
  });

  describe('edge cases', () => {
    it('should handle class with empty description', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101', description: null } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(StudentEnrollment);
    });

    it('should handle class with long name', async () => {
      const longName = 'A'.repeat(200);
      const mockClass = { id: new ClassId(classId), name: longName } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      const result = await useCase.execute(command);

      expect(result.isActive).toBe(true);
    });

    it('should create enrollment with null leftAt for new enrollments', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.leftAt).toBeNull();
    });

    it('should create enrollment with isActive true for new enrollments', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.isActive).toBe(true);
    });

    it('should pass EnrollmentId correctly', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      const savedEnrollment = vi.mocked(mockEnrollmentRepository.save).mock.calls[0][0];
      expect(savedEnrollment.id).toBeDefined();
    });
  });

  describe('repository interactions', () => {
    it('should call findByClassAndStudent before saving', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
      vi.mocked(mockEnrollmentRepository.findByClassAndStudent).mockResolvedValue(null);

      const command = new StudentJoinClassCommand(classId, studentId);

      await useCase.execute(command);

      expect(mockEnrollmentRepository.findByClassAndStudent).toHaveBeenCalledWith(
        expect.any(ClassId),
        expect.any(UserId)
      );
    });

    it('should use same classId and studentId for checking existing enrollment', async () => {
      const mockClass = { id: new ClassId(classId), name: 'Math 101' } as any;
      vi.mocked(mockClassRepository.findById).mockResolvedValue(mockClass);
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
