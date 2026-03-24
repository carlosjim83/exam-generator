import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetExamResultsUseCase } from '@application/use-cases/student/GetExamResultsUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { Exam } from '@domain/entities/Exam.js';
import { Question, QuestionType } from '@domain/entities/Question.js';
import { StudentAnswer } from '@domain/entities/StudentAnswer.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { QuestionId } from '@domain/value-objects/QuestionId.js';

describe('GetExamResultsUseCase', () => {
  let useCase: GetExamResultsUseCase;
  let mockAssignmentRepo: IExamAssignmentRepository;
  let mockExamRepo: IExamRepository;
  let mockAnswerRepo: IStudentAnswerRepository;

  const studentId = '550e8400-e29b-41d4-a716-446655440001';
  const differentStudentId = '550e8400-e29b-41d4-a716-446655440099';
  const teacherId = '550e8400-e29b-41d4-a716-446655440002';
  const examId = '550e8400-e29b-41d4-a716-446655440003';
  const assignmentId = 'assignment-id-123';
  const question1Id = '550e8400-e29b-41d4-a716-446655440011';
  const question2Id = '550e8400-e29b-41d4-a716-446655440012';

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
    } as any;

    useCase = new GetExamResultsUseCase(mockAssignmentRepo, mockAnswerRepo, mockExamRepo);
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
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 80,
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
      ).rejects.toThrow('You can only view your own results');
    });

    it('should throw error if assignment is not submitted or graded yet', async () => {
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

      // Act & Assert
      await expect(
        useCase.execute({
          assignmentId,
          studentId,
        })
      ).rejects.toThrow('Exam has not been submitted yet');
    });

    it('should throw error if exam does not exist', async () => {
      // Arrange
      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 80,
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
        })
      ).rejects.toThrow('Exam not found');
    });
  });

  describe('🟢 GREEN: Success cases', () => {
    it('should return exam results for SUBMITTED assignments', async () => {
      // Arrange
      const question1 = Question.create({
        id: QuestionId.create(question1Id),
        examId,
        text: 'What is 2+2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        explanation: 'Basic arithmetic',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

      const answer1 = StudentAnswer.create({
        id: 'answer-1',
        assignmentId: AssignmentId.create(assignmentId),
        questionId: question1Id,
        answerText: '4',
        isCorrect: null, // Not graded yet
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAnswerRepo.findByAssignment).mockResolvedValue([answer1]);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.assignment).toBe(assignment);
      expect(result.exam).toBe(exam);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].studentAnswer).toBe(answer1);
      expect(result.results[0].isCorrect).toBeNull(); // Not graded yet
    });

    it('should return exam results with all question details', async () => {
      // Arrange
      const question1 = Question.create({
        id: QuestionId.create(question1Id),
        examId,
        text: 'What is 2+2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        explanation: 'Basic arithmetic',
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
        explanation: 'Paris is the capital of France',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const assignment = ExamAssignment.create({
        id: AssignmentId.create(assignmentId),
        examId,
        studentId: UserId.create(studentId),
        teacherId: UserId.create(teacherId),
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 10,
        feedback: 'Good effort',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const exam = Exam.create({
        id: ExamId.create(examId),
        title: 'Test Exam',
        description: 'Test Description',
        userId: UserId.create(teacherId),
        generatedFrom: [],
        questions: [question1, question2],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const answer1 = StudentAnswer.create({
        id: 'answer-1',
        assignmentId: AssignmentId.create(assignmentId),
        questionId: question1Id,
        answerText: '4',
        isCorrect: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const answer2 = StudentAnswer.create({
        id: 'answer-2',
        assignmentId: AssignmentId.create(assignmentId),
        questionId: question2Id,
        answerText: 'London',
        isCorrect: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAnswerRepo.findByAssignment).mockResolvedValue([answer1, answer2]);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.assignment).toBe(assignment);
      expect(result.exam).toBe(exam);
      expect(result.results).toHaveLength(2);

      // Check first question result (correct answer)
      expect(result.results[0].question.id).toBe(question1Id);
      expect(result.results[0].studentAnswer).toBe(answer1);
      expect(result.results[0].isCorrect).toBe(true);
      expect(result.results[0].correctAnswer).toBe('4');
      expect(result.results[0].explanation).toBe('Basic arithmetic');

      // Check second question result (incorrect answer)
      expect(result.results[1].question.id).toBe(question2Id);
      expect(result.results[1].studentAnswer).toBe(answer2);
      expect(result.results[1].isCorrect).toBe(false);
      expect(result.results[1].correctAnswer).toBe('Paris');
      expect(result.results[1].explanation).toBe('Paris is the capital of France');
    });

    it('should handle questions with no student answers', async () => {
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
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 0,
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

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAnswerRepo.findByAssignment).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].studentAnswer).toBeNull();
      expect(result.results[0].isCorrect).toBeNull();
    });

    it('should return results with score and feedback', async () => {
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
        status: ExamAssignmentStatus.GRADED,
        dueDate: null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 10,
        feedback: 'Excellent work!',
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

      vi.mocked(mockAssignmentRepo.findById).mockResolvedValue(assignment);
      vi.mocked(mockExamRepo.findByIdWithQuestions).mockResolvedValue(exam);
      vi.mocked(mockAnswerRepo.findByAssignment).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        assignmentId,
        studentId,
      });

      // Assert
      expect(result.assignment.score).toBe(10);
      expect(result.assignment.feedback).toBe('Excellent work!');
    });
  });
});
