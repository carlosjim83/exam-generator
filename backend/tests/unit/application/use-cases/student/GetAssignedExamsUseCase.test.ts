import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAssignedExamsUseCase } from '@application/use-cases/student/GetAssignedExamsUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

describe('GetAssignedExamsUseCase', () => {
  let useCase: GetAssignedExamsUseCase;
  let mockAssignmentRepo: IExamAssignmentRepository;

  const studentId = '550e8400-e29b-41d4-a716-446655440001';
  const teacherId = '550e8400-e29b-41d4-a716-446655440002';
  const examId1 = '550e8400-e29b-41d4-a716-446655440003';
  const examId2 = '550e8400-e29b-41d4-a716-446655440004';

  beforeEach(() => {
    mockAssignmentRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByStudent: vi.fn(),
      findByExamAndStudent: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findAllWithExam: vi.fn(),
    } as any;

    useCase = new GetAssignedExamsUseCase(mockAssignmentRepo);
  });

  describe('🔴 RED: Error cases', () => {
    it('should throw error if studentId is empty', async () => {
      await expect(useCase.execute({ studentId: '' })).rejects.toThrow('studentId is required');
    });

    it('should throw error if studentId is invalid', async () => {
      await expect(useCase.execute({ studentId: 'invalid-id' })).rejects.toThrow();
    });
  });

  describe('🟢 GREEN: Success cases', () => {
    it('should return empty array when student has no assignments', async () => {
      // Arrange
      vi.mocked(mockAssignmentRepo.findAllWithExam).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ studentId });

      // Assert
      expect(result.assignments).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockAssignmentRepo.findAllWithExam).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: expect.objectContaining({ value: studentId }),
        })
      );
    });

    it('should return all assignments for student', async () => {
      // Arrange
      const assignment1 = ExamAssignment.create({
        id: AssignmentId.create('assignment-1'),
        examId: examId1,
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

      const assignment2 = ExamAssignment.create({
        id: AssignmentId.create('assignment-2'),
        examId: examId2,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.IN_PROGRESS,
        dueDate: new Date('2026-03-15T23:59:59Z'),
        startedAt: new Date('2026-02-10T14:30:00Z'),
        submittedAt: null,
        score: null,
        feedback: null,
        createdAt: new Date('2026-02-05T10:00:00Z'),
        updatedAt: new Date('2026-02-10T14:30:00Z'),
      });

      vi.mocked(mockAssignmentRepo.findAllWithExam).mockResolvedValue([
        {
          assignment: assignment1,
          exam: {
            id: examId1,
            title: 'Exam 1',
            description: null,
            questionCount: 10,
            maxScore: 100,
          },
        },
        {
          assignment: assignment2,
          exam: { id: examId2, title: 'Exam 2', description: null, questionCount: 5, maxScore: 50 },
        },
      ]);

      // Act
      const result = await useCase.execute({ studentId });

      // Assert
      expect(result.assignments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.assignments[0].assignment.status).toBe('PENDING');
      expect(result.assignments[1].assignment.status).toBe('IN_PROGRESS');
    });

    it('should filter assignments by status', async () => {
      // Arrange
      const pendingAssignment = ExamAssignment.create({
        id: AssignmentId.create('assignment-1'),
        examId: examId1,
        studentId: UserId.create(studentId),
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

      vi.mocked(mockAssignmentRepo.findAllWithExam).mockResolvedValue([
        {
          assignment: pendingAssignment,
          exam: {
            id: examId1,
            title: 'Exam 1',
            description: null,
            questionCount: 10,
            maxScore: 100,
          },
        },
      ]);

      // Act
      const result = await useCase.execute({
        studentId,
        status: 'PENDING',
      });

      // Assert
      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].assignment.status).toBe('PENDING');
      expect(mockAssignmentRepo.findAllWithExam).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: expect.objectContaining({ value: studentId }),
          status: ExamAssignmentStatus.PENDING,
        })
      );
    });

    it('should return assignments with all status details', async () => {
      // Arrange
      const submittedAssignment = ExamAssignment.create({
        id: AssignmentId.create('assignment-1'),
        examId: examId1,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.SUBMITTED,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        startedAt: new Date('2026-02-20T10:00:00Z'),
        submittedAt: new Date('2026-02-20T11:30:00Z'),
        score: null,
        feedback: null,
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date('2026-02-20T11:30:00Z'),
      });

      vi.mocked(mockAssignmentRepo.findAllWithExam).mockResolvedValue([
        {
          assignment: submittedAssignment,
          exam: {
            id: examId1,
            title: 'Exam 1',
            description: null,
            questionCount: 10,
            maxScore: 100,
          },
        },
      ]);

      // Act
      const result = await useCase.execute({ studentId });

      // Assert
      expect(result.assignments[0].assignment).toMatchObject({
        status: 'SUBMITTED',
        startedAt: expect.any(Date),
        submittedAt: expect.any(Date),
        dueDate: expect.any(Date),
      });
    });

    it('should return graded assignment with score', async () => {
      // Arrange
      const gradedAssignment = ExamAssignment.create({
        id: AssignmentId.create('assignment-1'),
        examId: examId1,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.GRADED,
        dueDate: new Date('2026-03-01T23:59:59Z'),
        startedAt: new Date('2026-02-20T10:00:00Z'),
        submittedAt: new Date('2026-02-20T11:30:00Z'),
        score: 85.5,
        feedback: 'Good work!',
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date('2026-02-21T09:00:00Z'),
      });

      vi.mocked(mockAssignmentRepo.findAllWithExam).mockResolvedValue([
        {
          assignment: gradedAssignment,
          exam: {
            id: examId1,
            title: 'Exam 1',
            description: null,
            questionCount: 10,
            maxScore: 100,
          },
        },
      ]);

      // Act
      const result = await useCase.execute({ studentId });

      // Assert
      expect(result.assignments[0].assignment).toMatchObject({
        status: 'GRADED',
        score: 85.5,
        feedback: 'Good work!',
      });
    });
  });
});
