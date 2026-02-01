/**
 * Shared types and enums for exam generation
 * Used across domain, application, and infrastructure layers
 */

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  MIXED = 'MIXED', // For exam generation, not for individual questions
}

/**
 * Type guard to check if difficulty is storable (not MIXED)
 */
export function isStorableDifficulty(
  difficulty: QuestionDifficulty
): difficulty is Exclude<QuestionDifficulty, QuestionDifficulty.MIXED> {
  return difficulty !== QuestionDifficulty.MIXED;
}

/**
 * Get storable difficulty values (excluding MIXED)
 */
export type StorableDifficulty = Exclude<QuestionDifficulty, QuestionDifficulty.MIXED>;
