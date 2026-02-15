import {
  IExamAssignmentRepository,
  FindAssignmentsFilters,
} from '@domain/repositories/IExamAssignmentRepository.js';
import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetAssignedExamsInput {
  studentId: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ALL';
}

export interface GetAssignedExamsOutput {
  assignments: ExamAssignment[];
  total: number;
}

export class GetAssignedExamsUseCase {
  constructor(private assignmentRepo: IExamAssignmentRepository) {}

  async execute(input: GetAssignedExamsInput): Promise<GetAssignedExamsOutput> {
    // Validate studentId
    if (!input.studentId || input.studentId.trim().length === 0) {
      throw new Error('studentId is required');
    }

    const filters: FindAssignmentsFilters = {
      studentId: UserId.create(input.studentId),
    };

    if (input.status && input.status !== 'ALL') {
      filters.status = input.status as ExamAssignmentStatus;
    }

    const assignments = await this.assignmentRepo.findAll(filters);

    return {
      assignments,
      total: assignments.length,
    };
  }
}
