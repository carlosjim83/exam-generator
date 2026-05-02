import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetExamResultsUseCase } from '@application/use-cases/student/GetExamResultsUseCase.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import { ExamMother } from '@tests/helpers/factories/ExamMother.js';
import { ExamAssignmentMother } from '@tests/helpers/factories/ExamAssignmentMother.js';
import { QuestionMother } from '@tests/helpers/factories/QuestionMother.js';
import { StudentAnswerMother } from '@tests/helpers/factories/StudentAnswerMother.js';

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
      const assignment = ExamAssignmentMother.graded({
        id: assignmentId,
        examId,
        studentId: differentStudentId,
        teacherId,
        score: 80,
        feedback: null,
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
      const assignment = ExamAssignmentMother.inProgress({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
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
      const assignment = ExamAssignmentMother.graded({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        score: 80,
        feedback: null,
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
      const question1 = QuestionMother.multipleChoice({
        id: question1Id,
        examId,
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        explanation: 'Basic arithmetic',
      });

      const assignment = ExamAssignmentMother.submitted({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        score: null,
        feedback: null,
      });

      const exam = ExamMother.create({
        id: examId,
        userId: teacherId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [question1],
      });

      const answer1 = StudentAnswerMother.ungraded({
        id: 'answer-1',
        assignmentId,
        questionId: question1Id,
        answerText: '4',
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
      const question1 = QuestionMother.multipleChoice({
        id: question1Id,
        examId,
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
        explanation: 'Basic arithmetic',
      });

      const question2 = QuestionMother.multipleChoice({
        id: question2Id,
        examId,
        questionText: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        points: 10,
        explanation: 'Paris is the capital of France',
      });

      const assignment = ExamAssignmentMother.graded({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        score: 10,
        feedback: 'Good effort',
      });

      const exam = ExamMother.create({
        id: examId,
        userId: teacherId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [question1, question2],
      });

      const answer1 = StudentAnswerMother.correct({
        id: 'answer-1',
        assignmentId,
        questionId: question1Id,
        answerText: '4',
      });

      const answer2 = StudentAnswerMother.incorrect({
        id: 'answer-2',
        assignmentId,
        questionId: question2Id,
        answerText: 'London',
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
      const question1 = QuestionMother.multipleChoice({
        id: question1Id,
        examId,
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
      });

      const assignment = ExamAssignmentMother.graded({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        score: 0,
        feedback: null,
      });

      const exam = ExamMother.create({
        id: examId,
        userId: teacherId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [question1],
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
      const question1 = QuestionMother.multipleChoice({
        id: question1Id,
        examId,
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
        points: 10,
      });

      const assignment = ExamAssignmentMother.graded({
        id: assignmentId,
        examId,
        studentId,
        teacherId,
        score: 10,
        feedback: 'Excellent work!',
      });

      const exam = ExamMother.create({
        id: examId,
        userId: teacherId,
        title: 'Test Exam',
        description: 'Test Description',
        questions: [question1],
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
