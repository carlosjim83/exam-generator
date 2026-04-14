import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartExamUseCase } from '@application/use-cases/student/StartExamUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

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
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(differentStudentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.PENDING,
        dueDate: null,
        startedAt: null,
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.IN_PROGRESS,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.SUBMITTED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: null,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const pendingAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.PENDING,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        startedAt: null,
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date('2026-02-01T10:00:00Z'),
      });

      const startedAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.IN_PROGRESS,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        startedAt: new Date(),
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date(),
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

      const pendingAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.PENDING,
        dueDate,
        startedAt: null,
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt,
        updatedAt: createdAt,
      });

      const startedAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.IN_PROGRESS,
        dueDate,
        startedAt: new Date(),
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt,
        updatedAt: new Date(),
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
