import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface StudentClassExamItem {
  id: string;
  classId: string;
  examId: string;
  examTitle: string;
  questionCount: number;
  availableAt: Date | null;
  dueDate: Date | null;
  timeLimit: number | null;
  maxAttempts: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  attemptNumber: number;
  remainingAttempts: number;
}

export interface GetStudentClassExamsInput {
  studentId: string;
  classId: string;
}

export interface GetStudentClassExamsOutput {
  exams: StudentClassExamItem[];
}

/**
 * GetStudentClassExamsUseCase
 *
 * Gets all available exams for a student in a specific class.
 */
export class GetStudentClassExamsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly examRepository: IExamRepository,
    private readonly assignmentRepository: IExamAssignmentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: GetStudentClassExamsInput): Promise<GetStudentClassExamsOutput> {
    const studentId = UserId.create(input.studentId);
    const classId = ClassId.create(input.classId);

    // Verify student is enrolled in this class
    const cls = await this.classRepository.findById(classId);
    if (!cls) {
      throw new Error('Class not found');
    }

    // Get published class exams for this class
    const classExams = await this.classExamRepository.findByClassId(classId, {
      publishedOnly: true,
    });

    // Get exam details and assignment status for each
    const examsWithNulls = await Promise.all(
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

        // Check availability window
        const now = new Date();
        const isAvailable = ce.availableAt ? now >= ce.availableAt : true;

        // Skip if not yet available
        if (!isAvailable) {
          return null;
        }

        return {
          id: ce.id.toString(),
          classId: ce.classId.toString(),
          examId: ce.examId,
          examTitle: exam?.title ?? 'Unknown Exam',
          questionCount: exam?.questionCount ?? 0,
          availableAt: ce.availableAt,
          dueDate: ce.dueDate,
          timeLimit: ce.timeLimit,
          maxAttempts: ce.maxAttempts,
          status: status as StudentClassExamItem['status'],
          score: assignment?.score ?? null,
          attemptNumber,
          remainingAttempts: Math.max(0, remainingAttempts),
        };
      })
    );

    // Filter out nulls (unavailable exams)
    const availableExams = examsWithNulls.filter((e): e is StudentClassExamItem => e !== null);

    return { exams: availableExams };
  }
}
