/**
 * ExamAssignment Mother
 * Provides pre-configured ExamAssignment domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize ExamAssignment entity creation for unit tests (no DB calls)
 */

import { ExamAssignment, ExamAssignmentStatus } from '@domain/entities/ExamAssignment.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ExamAssignmentMotherOptions {
  id?: string;
  examId?: string;
  studentId?: string;
  teacherId?: string;
  status?: ExamAssignmentStatus;
  dueDate?: Date | null;
  startedAt?: Date | null;
  submittedAt?: Date | null;
  score?: number | null;
  feedback?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExamAssignmentMother {
  /**
   * Creates a pending assignment
   */
  static pending(overrides: ExamAssignmentMotherOptions = {}): ExamAssignment {
    return this.create({ status: ExamAssignmentStatus.PENDING, ...overrides });
  }

  /**
   * Creates an in-progress assignment
   */
  static inProgress(overrides: ExamAssignmentMotherOptions = {}): ExamAssignment {
    return this.create({
      status: ExamAssignmentStatus.IN_PROGRESS,
      startedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Creates a submitted assignment
   */
  static submitted(overrides: ExamAssignmentMotherOptions = {}): ExamAssignment {
    return this.create({
      status: ExamAssignmentStatus.SUBMITTED,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Creates a graded assignment
   */
  static graded(overrides: ExamAssignmentMotherOptions = {}): ExamAssignment {
    return this.create({
      status: ExamAssignmentStatus.GRADED,
      startedAt: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 3600000),
      score: 85,
      feedback: 'Good job!',
      ...overrides,
    });
  }

  /**
   * Base factory method - creates ExamAssignment domain entity
   */
  static create(overrides: ExamAssignmentMotherOptions = {}): ExamAssignment {
    const now = new Date();
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000008';
    const examId = overrides.examId ?? '00000000-0000-0000-0000-000000000003';
    const studentId = overrides.studentId ?? '00000000-0000-0000-0000-000000000009';
    const teacherId = overrides.teacherId ?? '00000000-0000-0000-0000-000000000002';

    return ExamAssignment.create({
      id: AssignmentId.create(id),
      examId,
      studentId: UserId.create(studentId),
      teacherId: UserId.create(teacherId),
      status: overrides.status ?? ExamAssignmentStatus.PENDING,
      dueDate: overrides.dueDate !== undefined ? overrides.dueDate : null,
      startedAt: overrides.startedAt !== undefined ? overrides.startedAt : null,
      submittedAt: overrides.submittedAt !== undefined ? overrides.submittedAt : null,
      score: overrides.score !== undefined ? overrides.score : null,
      feedback: overrides.feedback !== undefined ? overrides.feedback : null,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    });
  }
}
