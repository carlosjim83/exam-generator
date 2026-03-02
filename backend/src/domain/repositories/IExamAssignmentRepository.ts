import type { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import type { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import type { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export interface CreateExamAssignmentDTO {
  examId: string;
  studentId: UserId;
  teacherId: UserId;
  dueDate?: Date;
  classExamId?: string;
}

export interface FindAssignmentsFilters {
  studentId?: UserId;
  teacherId?: UserId;
  status?: ExamAssignmentStatus;
}

/**
 * IExamAssignmentRepository Interface (Port)
 * Defines operations for ExamAssignment persistence
 */
export interface IExamAssignmentRepository {
  findById(id: AssignmentId): Promise<ExamAssignment | null>;

  findByExamAndStudent(examId: string, studentId: UserId): Promise<ExamAssignment | null>;

  findAll(filters: FindAssignmentsFilters): Promise<ExamAssignment[]>;

  findByClassExamId(classExamId: ClassExamId): Promise<ExamAssignment[]>;

  countByClassExamId(classExamId: ClassExamId): Promise<number>;

  create(data: CreateExamAssignmentDTO): Promise<ExamAssignment>;

  update(assignment: ExamAssignment): Promise<ExamAssignment>;

  delete(id: AssignmentId): Promise<void>;
}
