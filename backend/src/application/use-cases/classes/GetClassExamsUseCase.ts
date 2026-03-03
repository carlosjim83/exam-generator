import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export interface ClassExamWithStats {
  id: string;
  classId: string;
  examId: string;
  examTitle: string;
  questionCount: number;
  availableAt: Date | null;
  dueDate: Date | null;
  timeLimit: number | null;
  isPublished: boolean;
  maxAttempts: number;
  showResultsImmediately: boolean;
  startedCount: number;
  submittedCount: number;
  gradedCount: number;
  assignedCount: number;
  createdAt: Date;
}

export interface GetClassExamsInput {
  classId: string;
  teacherId: string;
}

export interface GetClassExamsOutput {
  exams: ClassExamWithStats[];
}

/**
 * GetClassExamsUseCase
 *
 * Gets all exams assigned to a class with statistics (for teacher view).
 */
export class GetClassExamsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly examRepository: IExamRepository
  ) {}

  async execute(input: GetClassExamsInput): Promise<GetClassExamsOutput> {
    const classId = ClassId.create(input.classId);

    // Get class exams
    const classExams = await this.classExamRepository.findByClassIdWithStats(classId);

    // Build results without assigned count (requires separate query)
    const results = await Promise.all(
      classExams.map(async (ce) => {
        // Validate examId exists
        if (!ce.examId) {
          console.error('[GetClassExamsUseCase] ClassExam missing examId:', {
            id: ce.id,
            examId: ce.examId,
            classId: ce.classId,
          });
          return null; // Skip invalid records
        }

        // Get exam details
        const exam = await this.examRepository.findById(ce.examId);
        const questionCount = exam?.questionCount ?? 0;

        return {
          id: ce.id,
          classId: ce.classId,
          examId: ce.examId,
          examTitle: exam?.title ?? 'Unknown Exam',
          questionCount,
          availableAt: ce.availableAt,
          dueDate: ce.dueDate,
          timeLimit: ce.timeLimit,
          isPublished: ce.isPublished,
          maxAttempts: ce.maxAttempts,
          showResultsImmediately: ce.showResultsImmediately,
          startedCount: ce.startedCount,
          submittedCount: ce.submittedCount,
          gradedCount: ce.gradedCount,
          assignedCount: ce.startedCount + ce.submittedCount + ce.gradedCount, // Approximate
          createdAt: ce.createdAt,
        };
      })
    );

    // Filter out null results (invalid records)
    const examsWithStats = results.filter((r): r is ClassExamWithStats => r !== null);

    return { exams: examsWithStats };
  }
}
