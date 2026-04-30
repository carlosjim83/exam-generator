/**
 * Question Mother
 * Provides pre-configured Question domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize Question entity creation for unit tests (no DB calls)
 */

import { Question, QuestionType } from '@domain/entities/Question.js';
import type { StorableDifficulty } from '@domain/entities/ExamTypes.js';
import { ExamId } from '@domain/value-objects/ExamId.js';
import { QuestionId } from '@domain/value-objects/QuestionId.js';

export interface QuestionMotherOptions {
  id?: string;
  examId?: string;
  type?: QuestionType;
  difficulty?: StorableDifficulty;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  orderIndex?: number;
  sourceChunkIds?: string[];
}

export class QuestionMother {
  /**
   * Creates a multiple choice question
   */
  static multipleChoice(overrides: QuestionMotherOptions = {}): Question {
    return this.create({
      type: QuestionType.MULTIPLE_CHOICE,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      ...overrides,
    });
  }

  /**
   * Creates a true/false question
   */
  static trueFalse(overrides: QuestionMotherOptions = {}): Question {
    return this.create({
      type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      correctAnswer: 'True',
      ...overrides,
    });
  }

  /**
   * Creates a short answer question
   */
  static shortAnswer(overrides: QuestionMotherOptions = {}): Question {
    return this.create({
      type: QuestionType.SHORT_ANSWER,
      options: [],
      correctAnswer: 'Mock answer',
      ...overrides,
    });
  }

  /**
   * Base factory method - creates Question domain entity
   */
  static create(overrides: QuestionMotherOptions = {}): Question {
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000007';
    const examId = overrides.examId ?? '00000000-0000-0000-0000-000000000003';

    return Question.create({
      id: QuestionId.create(id),
      examId: ExamId.create(examId),
      type: overrides.type ?? QuestionType.MULTIPLE_CHOICE,
      difficulty: overrides.difficulty ?? 'EASY',
      questionText: overrides.questionText ?? 'What is the correct answer?',
      options: overrides.options ?? ['A', 'B', 'C', 'D'],
      correctAnswer: overrides.correctAnswer ?? 'A',
      explanation: overrides.explanation,
      points: overrides.points ?? 1,
      orderIndex: overrides.orderIndex ?? 0,
      sourceChunkIds: overrides.sourceChunkIds ?? [],
    });
  }
}
