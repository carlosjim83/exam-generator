import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartExamUseCase } from '@application/use-cases/student/StartExamUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { ExamAssignmentMother } from '@tests/helpers/factories/ExamAssignmentMother.js';

describe('StartExamUseCase', () => {
  let useCase: StartExamUseCase;
  let mockAssignmentRepo: IExamAssignmentRepository;
  let mockExamRepo: IExamRepository;

  const studentId = '550e8400-e29b-41d4-a716-446655440001';
  const differentStudentId = '550e8400-e29b-41d4-a716-446655440099';
  const teacherId = '550e8400-e29b-41d4-a716-446655440002';
  const examId = '550e8400-e29b-41d4-a716-446655440003';
  const assignmentId = 'assignment-id-123';

  beforeEach(() => {
    mockAssignmentRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByStudent: vi.fn(),
      findByExamAndStudent: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    } as any;

    mockExamRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdWithQuestions: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
    } as any;

    useCase = new StartExamUseCase(mockAssignmentRepo, mockExamRepo);
  });

  describe('🔴 RED: Error cases', () => {
    it('should throw error if assignment does not exist', async () => {
      // Arrange
      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
        })
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if assignment does not belong to student', async () => {
      // Arrange
      const assignment = ExamAssignmentMother.pending({
        id: assignmentId,
        examId,
        studentId: differentStudentId,
        teacherId,
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
        })
      ).rejects.toThrow('You can only access your own assignments');
    });

    it('should resume exam if already IN_PROGRESS', async () => {
      // Arrange
      const assignment = ExamAssignmentMother.inProgress({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
      });

      const mockExam = {
        id: examId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [],
      };

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findById).mockResolvedValue(mockExam as any);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert - should return the existing assignment without updating
      expect(result.assignment.status).toBe('IN_PROGRESS');
      expect(mockAssignmentRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error if assignment is already submitted', async () => {
      // Arrange
      const assignment = ExamAssignmentMother.submitted({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
      });

      const mockExam = {
        id: examId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [],
      };

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findById).mockResolvedValue(mockExam as any);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
        })
      ).rejects.toThrow('This exam has already been completed. Status: SUBMITTED');
    });
  });

  describe('🟢 GREEN: Success cases', () => {
    it('should start exam successfully and transition to IN_PROGRESS', async () => {
      // Arrange
      const pendingAssignment = ExamAssignmentMother.pending({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date('2026-02-01T10:00:00Z'),
      });

      const startedAssignment = ExamAssignmentMother.inProgress({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        createdAt: new Date('2026-02-01T10:00:00Z'),
      });

      const mockExam = {
        id: examId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [],
      };

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(pendingAssignment);
      vi.mocked(mockAssignmentRepo.update).mockResolvedValue(startedAssignment);
      vi.mocked(mockExamRepo.findById).mockResolvedValue(mockExam as any);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.assignment.status).toBe('IN_PROGRESS');
      expect(result.assignment.startedAt).toBeDefined();
      expect(result.assignment.startedAt).toBeInstanceOf(Date);
      expect(mockAssignmentRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExamAssignmentStatus.IN_PROGRESS,
        })
      );
    });

    it('should preserve all assignment details when starting', async () => {
      // Arrange
      const dueDate = new Date('2026-03-01T23:59:59Z');
      const createdAt = new Date('2026-02-01T10:00:00Z');

      const pendingAssignment = ExamAssignmentMother.pending({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        dueDate,
        createdAt,
        updatedAt: createdAt,
      });

      const startedAssignment = ExamAssignmentMother.inProgress({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        dueDate,
        createdAt,
      });

      const mockExam = {
        id: examId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [],
      };

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(pendingAssignment);
      vi.mocked(mockAssignmentRepo.update).mockResolvedValue(startedAssignment);
      vi.mocked(mockExamRepo.findById).mockResolvedValue(mockExam as any);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.assignment.examId).toBe(examId);
      expect(result.assignment.studentId.value).toBe(studentId);
      expect(result.assignment.dueDate).toEqual(dueDate);
    });
  });
});
