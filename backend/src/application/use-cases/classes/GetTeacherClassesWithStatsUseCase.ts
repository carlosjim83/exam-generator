import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
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
 * Gets all classes for a teacher with statistics (students, documents).
 * Note: examCount is always 0 for now (exams are assigned to students, not classes).
 */
export class GetTeacherClassesWithStatsUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository
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
        // cls.id is already a ClassId, no need to create a new one
        const [studentCount, documentCount] = await Promise.all([
          this.enrollmentRepository.countByClassId(cls.id),
          this.classDocumentRepository.countByClassId(cls.id),
        ]);

        return {
          id: cls.id.toString(),
          name: cls.name,
          code: cls.code, // code is a string, not a value object
          description: cls.description,
          color: cls.color,
          studentCount,
          documentCount,
          examCount: 0, // TODO: Implement exam count when exams are linked to classes
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
