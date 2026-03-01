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

export interface GetStudentClassesWithStatsInput {
  studentId: string;
}

export interface GetStudentClassesWithStatsOutput {
  classes: ClassWithStats[];
}

/**
 * GetStudentClassesWithStatsUseCase
 *
 * Gets all classes for a student with statistics (students, documents, exams).
 * For students, only published exams and visible documents are counted.
 */
export class GetStudentClassesWithStatsUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly classExamRepository: IClassExamRepository
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
        // For students, only count VISIBLE documents and PUBLISHED exams
        const [studentCount, documentCount, examCount] = await Promise.all([
          this.enrollmentRepository.countByClassId(classEntity.id),
          this.classDocumentRepository.countByClassId(classEntity.id, { visibleOnly: true }),
          this.classExamRepository.countByClassId(classEntity.id, { publishedOnly: true }),
        ]);

        classes.push({
          id: classEntity.id.toString(),
          name: classEntity.name,
          code: classEntity.code,
          description: classEntity.description,
          color: classEntity.color,
          studentCount,
          documentCount,
          examCount,
          createdAt: classEntity.createdAt,
        });
      }
    }

    return { classes };
  }
}
