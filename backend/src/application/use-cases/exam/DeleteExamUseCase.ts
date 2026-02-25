/**
 * DeleteExamUseCase
 *
 * Business logic for deleting an exam
 * - Verifies exam exists
 * - Verifies user owns the exam
 * - Deletes exam (cascade deletes questions via Prisma)
 */

import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface DeleteExamInput {
  examId: string;
  userId: string;
}

export interface DeleteExamOutput {
  success: boolean;
  message: string;
}

export class DeleteExamUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(input: DeleteExamInput): Promise<DeleteExamOutput> {
    // Validate input
    if (!input.examId) {
      throw new Error('examId is required');
    }
    if (!input.userId) {
      throw new Error('userId is required');
    }

    const examId = ExamId.create(input.examId);
    const userId = UserId.create(input.userId);

    // Check if exam exists and get it to verify ownership
    const exam = await this.examRepository.findById(examId.value);

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Verify ownership
    if (exam.userId !== userId.value) {
      throw new Error('Unauthorized: You do not have access to this exam');
    }

    // Delete exam (cascade deletes questions)
    await this.examRepository.delete(examId.value);

    return {
      success: true,
      message: 'Exam deleted successfully',
    };
  }
}
