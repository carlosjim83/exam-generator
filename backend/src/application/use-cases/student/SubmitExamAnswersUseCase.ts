import type { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '@domain/errors/DomainError.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import type { IAnswerGradingService } from '@domain/services/IAnswerGradingService.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

export interface SubmitExamAnswersInput {
  assignmentId: string;
  studentId: string;
  answers: Array<{
    questionId: string;
    answerText: string;
  }>;
}

export class SubmitExamAnswersUseCase {
  constructor(
    private readonly assignmentRepo: IExamAssignmentRepository,
    private readonly answerRepo: IStudentAnswerRepository,
    private readonly examRepo: IExamRepository,
    private readonly gradingService: IAnswerGradingService
  ) {}

  async execute(input: SubmitExamAnswersInput): Promise<ExamAssignment> {
    // Find assignment
    const assignment = await this.assignmentRepo.findById(AssignmentId.create(input.assignmentId));

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify ownership
    if (assignment.studentId.value !== input.studentId) {
      throw new ForbiddenError('Assignment does not belong to student');
    }

    // Validate assignment can be submitted
    if (!assignment.canSubmit()) {
      throw new ConflictError(`Cannot submit assignment with status ${assignment.status}`);
    }

    // Get exam with questions
    const exam = await this.examRepo.findByIdWithQuestions(assignment.examId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Validate all questions belong to exam
    const examQuestionIds = exam.questions?.map((q) => q.id) || [];
    for (const answer of input.answers) {
      if (!examQuestionIds.includes(answer.questionId)) {
        throw new ValidationError(`Question ${answer.questionId} does not belong to exam`);
      }
    }

    // Process answers and calculate score
    let totalScore = 0;
    let hasUngradedQuestions = false;
    for (const answerInput of input.answers) {
      const question = exam.questions?.find((q) => q.id === answerInput.questionId);
      if (!question) continue;

      const { isCorrect, score } = await this.gradeAnswer(question, answerInput.answerText);

      // Save answer with grading info (upsert to handle existing answers)
      await this.answerRepo.upsert({
        assignmentId: assignment.id,
        questionId: answerInput.questionId,
        answerText: answerInput.answerText,
        isCorrect,
      });

      totalScore += score;

      // Track if there are questions that need manual grading
      if (question.type === 'SHORT_ANSWER' && isCorrect === null) {
        hasUngradedQuestions = true;
      }
    }

    // Submit assignment with score
    let submittedAssignment = assignment.submit(totalScore);

    // If all questions are auto-graded, mark as GRADED immediately
    if (!hasUngradedQuestions) {
      submittedAssignment = submittedAssignment.markAsGraded();
    }

    // Persist
    const updated = await this.assignmentRepo.update(submittedAssignment);

    return updated;
  }

  /**
   * Grade an answer based on question type
   */
  private async gradeAnswer(
    question: { type: string; correctAnswer?: string; questionText: string; points: number },
    answerText: string
  ): Promise<{ isCorrect: boolean; score: number }> {
    // Auto-grade based on question type
    if (question.type === 'MULTIPLE_CHOICE' && question.correctAnswer) {
      const isCorrect = answerText.trim() === question.correctAnswer.trim();
      return { isCorrect, score: isCorrect ? question.points : 0 };
    }

    if (question.type === 'TRUE_FALSE' && question.correctAnswer) {
      const normalizedStudent = answerText.trim().toLowerCase();
      const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
      const isCorrect = normalizedStudent === normalizedCorrect;
      return { isCorrect, score: isCorrect ? question.points : 0 };
    }

    if (question.type === 'SHORT_ANSWER') {
      const gradingResult = await this.gradingService.gradeAnswer({
        questionText: question.questionText,
        correctAnswer: question.correctAnswer || '',
        studentAnswer: answerText,
        points: question.points,
      });

      return { isCorrect: gradingResult.isCorrect, score: gradingResult.score };
    }

    return { isCorrect: false, score: 0 };
  }
}
