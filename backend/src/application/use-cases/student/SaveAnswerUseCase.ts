import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '@domain/errors/DomainError.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

/**
 * Save Answer Use Case
 *
 * Saves a single answer to a question WITHOUT submitting the exam.
 * Allows students to save progress as they navigate through questions.
 */

export interface SaveAnswerInput {
  assignmentId: string;
  questionId: string;
  answerText: string;
  studentId: string;
}

export interface SaveAnswerOutput {
  saved: boolean;
  questionId: string;
}

export class SaveAnswerUseCase {
  constructor(
    private readonly assignmentRepo: IExamAssignmentRepository,
    private readonly answerRepo: IStudentAnswerRepository,
    private readonly examRepo: IExamRepository
  ) {}

  async execute(input: SaveAnswerInput): Promise<SaveAnswerOutput> {
    const assignmentId = AssignmentId.create(input.assignmentId);

    // Find assignment
    const assignment = await this.assignmentRepo.findById(assignmentId);

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify ownership
    if (assignment.studentId.value !== input.studentId) {
      throw new ForbiddenError('Assignment does not belong to student');
    }

    // Validate assignment is in progress
    if (assignment.status !== 'IN_PROGRESS') {
      throw new ConflictError(
        `Cannot save answer for assignment with status ${assignment.status}. Exam must be in progress.`
      );
    }

    // Get exam to validate question belongs to it
    const exam = await this.examRepo.findById(assignment.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Validate question belongs to exam
    const questionExists = exam.questions?.some((q) => q.id === input.questionId);
    if (!questionExists) {
      throw new ValidationError(`Question ${input.questionId} does not belong to this exam`);
    }

    // Use upsert to create or update the answer
    await this.answerRepo.upsert({
      assignmentId,
      questionId: input.questionId,
      answerText: input.answerText,
    });

    return {
      saved: true,
      questionId: input.questionId,
    };
  }
}
