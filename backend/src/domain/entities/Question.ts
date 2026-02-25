/**
 * Question - Domain Entity
 * Represents a single exam question
 */

import type { ExamId } from '../value-objects/ExamId.js';
import type { QuestionId } from '../value-objects/QuestionId.js';

import type { QuestionType, StorableDifficulty } from './ExamTypes.js';

// Re-export for convenience
export { QuestionType, QuestionDifficulty } from './ExamTypes.js';

export interface QuestionProps {
  id: QuestionId;
  examId: ExamId;
  type: QuestionType;
  difficulty: StorableDifficulty; // Cannot be MIXED
  questionText: string;
  options: string[]; // Empty for SHORT_ANSWER, ["True", "False"] for TRUE_FALSE, 4 options for MULTIPLE_CHOICE
  correctAnswer: string;
  explanation?: string;
  points: number;
  orderIndex: number;
  sourceChunkIds: string[]; // IDs of document chunks used to generate this question
}

export class Question {
  private constructor(private props: QuestionProps) {}

  static create(props: QuestionProps): Question {
    return new Question(props);
  }

  // Getters
  get id(): string {
    return this.props.id.value;
  }

  get examId(): string {
    return this.props.examId.value;
  }

  get type(): QuestionType {
    return this.props.type;
  }

  get difficulty(): StorableDifficulty {
    return this.props.difficulty;
  }

  get questionText(): string {
    return this.props.questionText;
  }

  get options(): string[] {
    return this.props.options;
  }

  get correctAnswer(): string {
    return this.props.correctAnswer;
  }

  get explanation(): string | undefined {
    return this.props.explanation;
  }

  get points(): number {
    return this.props.points;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  get sourceChunkIds(): string[] {
    return this.props.sourceChunkIds;
  }
}
