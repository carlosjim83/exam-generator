import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitExamAnswersUseCase } from '@application/use-cases/student/SubmitExamAnswersUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { Exam } from '@domain/entities/Exam.js';
import { Question, QuestionType } from '@domain/entities/Question.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { QuestionId } from '@domain/value-objects/QuestionId.js';

describe('SubmitExamAnswersUseCase', () => {
  let useCase: SubmitExamAnswersUseCase;
  let mockAssignmentRepo: IExamAssignmentRepository;
  let mockExamRepo: IExamRepository;
  let mockAnswerRepo: IStudentAnswerRepository;
  let mockGradingService: { gradeAnswer: ReturnType<typeof vi.fn> };

  const studentId = '550e8400-e29b-41d4-a716-446655440001';
  const teacherId = '550e8400-e29b-41d4-a716-446655440002';
  const examId = '550e8400-e29b-41d4-a716-446655440003';
  const assignmentId = 'assignment-id-123';
  const question1Id = '550e8400-e29b-41d4-a716-446655440011';
  const question2Id = '550e8400-e29b-41d4-a716-446655440012';
  const question3Id = '550e8400-e29b-41d4-a716-446655440013';

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

    mockAnswerRepo = {
      create: vi.fn(),
      findByAssignment: vi.fn(),
      findByQuestion: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    } as any;

    mockGradingService = {
      gradeAnswer: vi.fn().mockResolvedValue({ isCorrect: false, score: 0 }),
    };

    useCase = new SubmitExamAnswersUseCase(
      mockAssignmentRepo,
      mockAnswerRepo,
      mockExamRepo,
      mockGradingService as any
    );
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
          answers: [],
        })
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if assignment does not belong to student', async () => {
      // Arrange
      const differentStudentId = '550e8400-e29b-41d4-a716-446655440099';
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(differentStudentId),
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

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
          answers: [],
        })
      ).rejects.toThrow('Assignment does not belong to student');
    });

    it('should throw error if assignment is not IN_PROGRESS', async () => {
      // Arrange
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
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

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
          answers: [],
        })
      ).rejects.toThrow('Cannot submit assignment with status PENDING');
    });

    it('should throw error if exam does not exist', async () => {
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

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
          answers: [],
        })
      ).rejects.toThrow('Exam not found');
    });

    it('should throw error if answer references non-existent question', async () => {
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

      const exam = Exam.create({
        id: ExamId.create(examId),
        title: 'Test Exam',
        description: 'Test Description',
        userId: UserId.create(teacherId),
        generatedFrom: [],
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
          answers: [
            {
              questionId: 'non-existent-question',
              answerText: 'Answer',
            },
          ],
        })
      ).rejects.toThrow('Question non-existent-question does not belong to exam');
    });
  });

  describe('🟢 GREEN: Success cases', () => {
    it('should submit exam successfully and auto-grade multiple-choice questions', async () => {
      // Arrange
      const question1 = Question.create({
        id: QuestionId.create(question1Id),
        examId,
        text: 'What is 2+2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const question2 = Question.create({
        id: QuestionId.create(question2Id),
        examId,
        text: 'What is the capital of France?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const question3 = Question.create({
        id: QuestionId.create(question3Id),
        examId,
        text: 'Explain photosynthesis',
        type: QuestionType.OPEN_ENDED,
        options: null,
        correctAnswer: null,
        points: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

      const exam = Exam.create({
        id: ExamId.create(examId),
        title: 'Test Exam',
        description: 'Test Description',
        userId: UserId.create(teacherId),
        generatedFrom: [],
        questions: [question1, question2, question3],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const gradedAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 10, // 1 correct MC (10 points) + 1 incorrect MC (0 points) + 1 open-ended (not graded yet)
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepo.update).mockResolvedValue(gradedAssignment);
      vi.mocked(mockAnswerRepo.upsert).mockResolvedValue(null as any);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
        answers: [
          { questionId: question1Id, answerText: '4' }, // Correct
          { questionId: question2Id, answerText: 'London' }, // Incorrect
          { questionId: question3Id, answerText: 'Plants use sunlight to make food' }, // Open-ended (needs manual grading)
        ],
      });

      // Assert
      expect(result.status).toBe('GRADED');
      expect(result.submittedAt).toBeDefined();
      expect(result.score).toBe(10); // Only MC questions auto-graded
      expect(mockAnswerRepo.upsert).toHaveBeenCalledTimes(3);
      expect(mockAssignmentRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ExamAssignmentStatus.GRADED,
        })
      );
    });

    it('should calculate score as 0 if all answers are wrong', async () => {
      // Arrange
      const question1 = Question.create({
        id: QuestionId.create(question1Id),
        examId,
        text: 'What is 2+2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

      const exam = Exam.create({
        id: ExamId.create(examId),
        title: 'Test Exam',
        description: 'Test Description',
        userId: UserId.create(teacherId),
        generatedFrom: [],
        questions: [question1],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const submittedAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.SUBMITTED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 0,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepo.update).mockResolvedValue(submittedAssignment);
      vi.mocked(mockAnswerRepo.upsert).mockResolvedValue(null as any);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
        answers: [{ questionId: question1Id, answerText: '1' }], // Wrong answer
      });

      // Assert
      expect(result.score).toBe(0);
    });

    it('should allow submitting exam with no answers', async () => {
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

      const exam = Exam.create({
        id: ExamId.create(examId),
        title: 'Test Exam',
        description: 'Test Description',
        userId: UserId.create(teacherId),
        generatedFrom: [],
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const gradedAssignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 0,
        feedback: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAssignmentRepo.update).mockResolvedValue(gradedAssignment);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
        answers: [],
      });

      // Assert
      expect(result.status).toBe('GRADED');
      expect(result.score).toBe(0);
      expect(mockAnswerRepo.upsert).not.toHaveBeenCalled();
    });
  });
});
