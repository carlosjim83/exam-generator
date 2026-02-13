import { ExamAssignment, ExamAssignmentStatus } from '../entities/ExamAssignment.js';
import { AssignmentId } from '../value-objects/AssignmentId.js';
import { UserId } from '../value-objects/UserId.js';

export interface CreateExamAssignmentDTO {
  examId: string;
  studentId: UserId;
  teacherId: UserId;
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

  create(data: CreateExamAssignmentDTO): Promise<ExamAssignment>;

  update(assignment: ExamAssignment): Promise<ExamAssignment>;

  delete(id: AssignmentId): Promise<void>;
}
