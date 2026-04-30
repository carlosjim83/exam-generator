/**
 * ClassExam Mother
 * Provides pre-configured ClassExam domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize ClassExam entity creation for unit tests (no DB calls)
 */

import { ClassExam } from '@domain/entities/ClassExam.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ClassExamMotherOptions {
  id?: string;
  classId?: string;
  examId?: string;
  teacherId?: string;
  availableAt?: Date | null;
  dueDate?: Date | null;
  timeLimit?: number | null;
  isPublished?: boolean;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClassExamMother {
  /**
   * Creates a published class exam that is available now
   */
  static published(overrides: ClassExamMotherOptions = {}): ClassExam {
    return this.create({
      isPublished: true,
      availableAt: new Date(Date.now() - 86400000), // 1 day ago
      ...overrides,
    });
  }

  /**
   * Creates a draft (unpublished) class exam
   */
  static draft(overrides: ClassExamMotherOptions = {}): ClassExam {
    return this.create({
      isPublished: false,
      availableAt: null,
      ...overrides,
    });
  }

  /**
   * Creates a class exam with a due date
   */
  static withDueDate(dueDate: Date, overrides: ClassExamMotherOptions = {}): ClassExam {
    return this.create({
      dueDate,
      ...overrides,
    });
  }

  /**
   * Creates a class exam with time limit
   */
  static withTimeLimit(minutes: number, overrides: ClassExamMotherOptions = {}): ClassExam {
    return this.create({
      timeLimit: minutes,
      ...overrides,
    });
  }

  /**
   * Base factory method - creates ClassExam domain entity
   */
  static create(overrides: ClassExamMotherOptions = {}): ClassExam {
    const now = new Date();
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000004';
    const classId = overrides.classId ?? '00000000-0000-0000-0000-000000000005';
    const examId = overrides.examId ?? '00000000-0000-0000-0000-000000000006';
    const teacherId = overrides.teacherId ?? '00000000-0000-0000-0000-000000000002';

    return ClassExam.create({
      id: ClassExamId.create(id),
      classId: new ClassId(classId),
      examId,
      teacherId: UserId.create(teacherId),
      availableAt: overrides.availableAt !== undefined ? overrides.availableAt : null,
      dueDate: overrides.dueDate !== undefined ? overrides.dueDate : null,
      timeLimit: overrides.timeLimit !== undefined ? overrides.timeLimit : null,
      isPublished: overrides.isPublished ?? false,
      maxAttempts: overrides.maxAttempts ?? 1,
      showResultsImmediately: overrides.showResultsImmediately ?? true,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    });
  }
}
