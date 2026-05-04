import type { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

export interface StartExamInput {
  assignmentId: string;
  studentId: string;
}

export interface StartExamOutput {
  assignment: ExamAssignment;
  exam: {
    id: string;
    title: string;
    description: string | null;
    questions: Array<{
      id: string;
      text: string;
      order: number;
      type: string;
      options: string[];
    }>;
  };
}

/**
 * Start or resume an exam assignment
 *
 * - If PENDING: Start the exam (change status to IN_PROGRESS)
 * - If IN_PROGRESS: Resume (return existing assignment with questions)
 * - If SUBMITTED/GRADED: Throw error (cannot resume completed exam)
 */
export class StartExamUseCase {
  constructor(
    private readonly assignmentRepo: IExamAssignmentRepository,
    private readonly examRepo: IExamRepository
  ) {}

  async execute(input: StartExamInput): Promise<StartExamOutput> {
    const assignmentId = AssignmentId.create(input.assignmentId);

    const assignment = await this.assignmentRepo.findById(assignmentId);

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify ownership
    assertOwnership(
      assignment.studentId,
      input.studentId,
      'You can only access your own assignments'
    );

    let finalAssignment: ExamAssignment;

    if (assignment.status === 'PENDING') {
      // Start the exam for the first time
      finalAssignment = assignment.start();
      await this.assignmentRepo.update(finalAssignment);
    } else if (assignment.status === 'IN_PROGRESS') {
      // Resume: return existing assignment
      finalAssignment = assignment;
    } else {
      // SUBMITTED or GRADED - cannot resume
      throw new ConflictError(`This exam has already been completed. Status: ${assignment.status}`);
    }

    // Get exam with questions
    const exam = await this.examRepo.findById(assignment.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Get questions (they might not be loaded)
    const questions = exam.questions ?? [];

    return {
      assignment: finalAssignment,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description ?? null,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.questionText,
          order: q.orderIndex,
          type: q.type,
          options: q.options,
        })),
      },
    };
  }
}
