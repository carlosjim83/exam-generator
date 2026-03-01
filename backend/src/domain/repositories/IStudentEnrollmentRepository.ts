import type { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export interface IStudentEnrollmentRepository {
  findById(id: EnrollmentId): Promise<StudentEnrollment | null>;
  findByClassId(
    classId: ClassId,
    options?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }
  ): Promise<{ enrollments: StudentEnrollment[]; total: number }>;
  findByStudentId(
    studentId: UserId,
    options?: { activeOnly?: boolean }
  ): Promise<StudentEnrollment[]>;
  findByClassAndStudent(classId: ClassId, studentId: UserId): Promise<StudentEnrollment | null>;
  save(enrollment: StudentEnrollment): Promise<void>;
  delete(id: EnrollmentId): Promise<void>;
  deleteByClassId(classId: ClassId): Promise<void>;
  isStudentEnrolled(classId: ClassId, studentId: UserId): Promise<boolean>;
  countByClassId(classId: ClassId): Promise<number>;
}
