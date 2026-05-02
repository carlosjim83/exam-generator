/**
 * Exam Mother
 * Provides pre-configured Exam domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize Exam entity creation for unit tests (no DB calls)
 */

import { Exam } from '@domain/entities/Exam.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ExamMotherOptions {
  id?: string;
  userId?: string;
  title?: string;
  description?: string;
  generatedFrom?: string[];
  promptUsed?: string;
  createdAt?: Date;
  updatedAt?: Date;
  questions?: any[];
  questionCount?: number;
}

export class ExamMother {
  /**
   * Creates a complete exam with default values
   */
  static complete(overrides: ExamMotherOptions = {}): Exam {
    return this.create({
      title: 'Complete Test Exam',
      description: 'A complete exam with multiple questions',
      ...overrides,
    });
  }

  /**
   * Creates a short exam
   */
  static short(overrides: ExamMotherOptions = {}): Exam {
    return this.create({
      title: 'Short Test Exam',
      description: 'A short exam',
      ...overrides,
    });
  }

  /**
   * Creates an empty exam
   */
  static empty(overrides: ExamMotherOptions = {}): Exam {
    return this.create({
      title: 'Empty Test Exam',
      description: 'An exam with no questions',
      questions: [],
      ...overrides,
    });
  }

  /**
   * Base factory method - creates Exam domain entity
   */
  static create(overrides: ExamMotherOptions = {}): Exam {
    const now = new Date();
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000003';
    const userId = overrides.userId ?? '00000000-0000-0000-0000-000000000002';

    return Exam.create({
      id: ExamId.create(id),
      userId: UserId.create(userId),
      title: overrides.title ?? 'Test Exam',
      description: overrides.description,
      generatedFrom: overrides.generatedFrom ?? [],
      promptUsed: overrides.promptUsed,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      questions: overrides.questions,
      questionCount: overrides.questionCount,
    });
  }
}
