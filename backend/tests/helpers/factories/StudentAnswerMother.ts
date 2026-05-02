/**
 * StudentAnswer Mother
 * Provides pre-configured StudentAnswer domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize StudentAnswer entity creation for unit tests (no DB calls)
 */

import { StudentAnswer } from '@domain/entities/StudentAnswer.js';
import { AssignmentId } from '@domain/value-objects/AssignmentId.js';

export interface StudentAnswerMotherOptions {
  id?: string;
  assignmentId?: string;
  questionId?: string;
  answerText?: string;
  isCorrect?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StudentAnswerMother {
  /**
   * Base factory method - creates StudentAnswer domain entity
   */
  static create(overrides: StudentAnswerMotherOptions = {}): StudentAnswer {
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000008';
    const assignmentId = overrides.assignmentId ?? '00000000-0000-0000-0000-000000000009';
    const questionId = overrides.questionId ?? '00000000-0000-0000-0000-000000000010';

    return StudentAnswer.create({
      id,
      assignmentId: AssignmentId.create(assignmentId),
      questionId,
      answerText: overrides.answerText ?? 'Mock answer text',
      isCorrect: overrides.isCorrect ?? null,
      createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
      updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
    });
  }

  /**
   * Creates a correct answer
   */
  static correct(overrides: StudentAnswerMotherOptions = {}): StudentAnswer {
    return this.create({
      isCorrect: true,
      ...overrides,
    });
  }

  /**
   * Creates an incorrect answer
   */
  static incorrect(overrides: StudentAnswerMotherOptions = {}): StudentAnswer {
    return this.create({
      isCorrect: false,
      ...overrides,
    });
  }

  /**
   * Creates an ungraded answer (isCorrect is null)
   */
  static ungraded(overrides: StudentAnswerMotherOptions = {}): StudentAnswer {
    return this.create({
      isCorrect: null,
      ...overrides,
    });
  }
}
