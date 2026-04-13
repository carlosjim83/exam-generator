import type { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import type {
  IExamAssignmentRepository,
  FindAssignmentsFilters,
} from '@domain/repositories/IExamAssignmentRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetAssignedExamsInput {
  studentId: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ALL';
}

export interface StudentExamListItem {
  assignment: ExamAssignment;
  examId: string;
  examTitle: string;
  examDescription: string | null;
  questionCount: number;
  maxScore: number;
}

export interface GetAssignedExamsOutput {
  assignments: StudentExamListItem[];
  total: number;
}

export class GetAssignedExamsUseCase {
  constructor(private readonly assignmentRepo: IExamAssignmentRepository) {}

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

    const assignmentsWithExam = await this.assignmentRepo.findAllWithExam(filters);

    const studentExamList: StudentExamListItem[] = assignmentsWithExam.map((item) => ({
      assignment: item.assignment,
      examId: item.exam.id,
      examTitle: item.exam.title,
      examDescription: item.exam.description,
      questionCount: item.exam.questionCount,
      maxScore: item.exam.maxScore,
    }));

    return {
      assignments: studentExamList,
      total: studentExamList.length,
    };
  }
}
