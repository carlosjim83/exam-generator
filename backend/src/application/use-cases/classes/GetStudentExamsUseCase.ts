import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface StudentExamItem {
  id: string;
  classId: string;
  className: string;
  examId: string;
  examTitle: string;
  questionCount: number;
  availableAt: Date | null;
  dueDate: Date | null;
  timeLimit: number | null;
  isPublished: boolean;
  maxAttempts: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  attemptNumber: number;
  remainingAttempts: number;
}

export interface GetStudentExamsInput {
  studentId: string;
}

export interface GetStudentExamsOutput {
  exams: StudentExamItem[];
}

/**
 * GetStudentExamsUseCase
 *
 * Gets all exams available to a student (published and within availability window).
 */
export class GetStudentExamsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly examRepository: IExamRepository,
    private readonly assignmentRepository: IExamAssignmentRepository
  ) {}

  async execute(input: GetStudentExamsInput): Promise<GetStudentExamsOutput> {
    const studentId = UserId.create(input.studentId);

    // Get all class exams for this student (through enrollments)
    const classExams = await this.classExamRepository.findByStudentId(studentId, {
      publishedOnly: true,
      availableOnly: true,
    });

    // Get exam details and assignment status for each
    const exams: StudentExamItem[] = await Promise.all(
      classExams.map(async (ce) => {
        // Get exam details
        const exam = await this.examRepository.findById(ce.examId);

        // Get assignment status for this student
        const assignment = await this.assignmentRepository.findByExamAndStudent(
          ce.examId,
          studentId
        );

        const status = assignment?.status ?? ('NOT_STARTED' as const);
        const attemptNumber = assignment ? 1 : 0; // TODO: Track multiple attempts
        const remainingAttempts = ce.maxAttempts - attemptNumber;

        return {
          id: ce.id.toString(),
          classId: ce.classId.toString(),
          className: '', // Will be populated by caller if needed
          examId: ce.examId,
          examTitle: exam?.title ?? 'Unknown Exam',
          questionCount: exam?.questionCount ?? 0,
          availableAt: ce.availableAt,
          dueDate: ce.dueDate,
          timeLimit: ce.timeLimit,
          isPublished: ce.isPublished,
          maxAttempts: ce.maxAttempts,
          status: status as StudentExamItem['status'],
          score: assignment?.score ?? null,
          attemptNumber,
          remainingAttempts: Math.max(0, remainingAttempts),
        };
      })
    );

    return { exams };
  }
}
