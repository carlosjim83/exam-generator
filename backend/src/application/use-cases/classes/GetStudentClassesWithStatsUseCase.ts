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

export interface GetStudentClassesWithStatsInput {
  studentId: string;
}

export interface GetStudentClassesWithStatsOutput {
  classes: ClassWithStats[];
}

/**
 * GetStudentClassesWithStatsUseCase
 *
 * Gets all classes for a student with statistics (students, documents).
 * Note: examCount is always 0 for now (exams are assigned to students, not classes).
 */
export class GetStudentClassesWithStatsUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository
  ) {}

  async execute(input: GetStudentClassesWithStatsInput): Promise<GetStudentClassesWithStatsOutput> {
    const studentId = UserId.create(input.studentId);

    // Get all active enrollments for this student
    const enrollments = await this.enrollmentRepository.findByStudentId(studentId, {
      activeOnly: true,
    });

    // Get class details for each enrollment
    const classes: ClassWithStats[] = [];
    for (const enrollment of enrollments) {
      const classEntity = await this.classRepository.findById(enrollment.classId);
      if (classEntity) {
        // Get stats for this class
        // For students, only count VISIBLE documents (they can't see drafts)
        const [studentCount, documentCount] = await Promise.all([
          this.enrollmentRepository.countByClassId(classEntity.id),
          this.classDocumentRepository.countByClassId(classEntity.id, { visibleOnly: true }),
        ]);

        classes.push({
          id: classEntity.id.toString(),
          name: classEntity.name,
          code: classEntity.code, // code is a string, not a value object
          description: classEntity.description,
          color: classEntity.color,
          studentCount,
          documentCount,
          examCount: 0, // TODO: Implement exam count when exams are linked to classes
          createdAt: classEntity.createdAt,
        });
      }
    }

    return { classes };
  }
}
