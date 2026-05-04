import type { Exam } from '@domain/entities/Exam.js';
import type { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import type { Question } from '@domain/entities/Question.js';
import type { StudentAnswer } from '@domain/entities/StudentAnswer.js';
import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

export interface GetExamResultsInput {
  assignmentId: string;
  studentId: string;
}

export interface QuestionResult {
  question: Question;
  studentAnswer: StudentAnswer | null;
  isCorrect: boolean | null;
  correctAnswer: string;
  explanation: string | null;
}

export interface ExamResults {
  assignment: ExamAssignment;
  exam: Exam;
  results: QuestionResult[];
}

export class GetExamResultsUseCase {
  constructor(
    private readonly assignmentRepo: IExamAssignmentRepository,
    private readonly answerRepo: IStudentAnswerRepository,
    private readonly examRepo: IExamRepository
  ) {}

  async execute(input: GetExamResultsInput): Promise<ExamResults> {
    // Find assignment
    const assignment = await this.assignmentRepo.findById(AssignmentId.create(input.assignmentId));

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify ownership
    assertOwnership(assignment.studentId, input.studentId, 'You can only view your own results');

    // Verify submitted or graded
    if (!assignment.isCompleted()) {
      throw new ConflictError('Exam has not been submitted yet');
    }

    // Get exam with questions
    const exam = await this.examRepo.findByIdWithQuestions(assignment.examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (!exam.questions || exam.questions.length === 0) {
      throw new ConflictError('Exam has no questions');
    }

    // Get student answers
    const studentAnswers = await this.answerRepo.findByAssignment(assignment.id);

    // Build results
    const results: QuestionResult[] = exam.questions.map((question) => {
      const studentAnswer = studentAnswers.find((a) => a.questionId === question.id);

      return {
        question,
        studentAnswer: studentAnswer || null,
        isCorrect: studentAnswer?.isCorrect ?? null,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || null,
      };
    });

    return {
      assignment,
      exam,
      results,
    };
  }
}
