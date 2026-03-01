import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ClassWithStats {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  studentCount: number;
  documentCount: number;
  examCount: number;
  createdAt: Date;
}

export interface GetTeacherClassesWithStatsInput {
  teacherId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetTeacherClassesWithStatsOutput {
  classes: ClassWithStats[];
  total: number;
}

/**
 * GetTeacherClassesWithStatsUseCase
 *
 * Gets all classes for a teacher with statistics (students, documents, exams).
 */
export class GetTeacherClassesWithStatsUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly classExamRepository: IClassExamRepository
  ) {}

  async execute(input: GetTeacherClassesWithStatsInput): Promise<GetTeacherClassesWithStatsOutput> {
    const teacherId = UserId.create(input.teacherId);
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const search = input.search ?? '';

    // Get classes
    const result = await this.classRepository.findByTeacherId(teacherId, {
      page,
      limit,
      search,
    });

    // Get stats for each class in parallel
    const classesWithStats = await Promise.all(
      result.classes.map(async (cls) => {
        const [studentCount, documentCount, examCount] = await Promise.all([
          this.enrollmentRepository.countByClassId(cls.id),
          this.classDocumentRepository.countByClassId(cls.id),
          this.classExamRepository.countByClassId(cls.id),
        ]);

        return {
          id: cls.id.toString(),
          name: cls.name,
          code: cls.code,
          description: cls.description,
          color: cls.color,
          studentCount,
          documentCount,
          examCount,
          createdAt: cls.createdAt,
        };
      })
    );

    return {
      classes: classesWithStats,
      total: result.total,
    };
  }
}
