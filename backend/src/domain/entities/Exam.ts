/**
 * Exam - Domain Entity
 * Represents an exam with multiple questions
 */

import { ExamId } from '../value-objects/ExamId.js';
import { UserId } from '../value-objects/UserId.js';
import { Question } from './Question.js';

export interface ExamProps {
  id: ExamId;
  userId: UserId;
  title: string;
  description?: string;
  generatedFrom: string[]; // Document IDs
  promptUsed?: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: Question[];
  questionCount?: number; // Optional override when questions array is not loaded
}

export class Exam {
  private constructor(private props: ExamProps) {}

  static create(props: ExamProps): Exam {
    return new Exam(props);
  }

  // Getters
  get id(): string {
    return this.props.id.value;
  }

  get userId(): string {
    return this.props.userId.value;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get generatedFrom(): string[] {
    return this.props.generatedFrom;
  }

  get promptUsed(): string | undefined {
    return this.props.promptUsed;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get questions(): Question[] | undefined {
    return this.props.questions;
  }

  get questionCount(): number {
    // Use explicit count if provided (for list queries), otherwise count array
    return this.props.questionCount ?? this.props.questions?.length ?? 0;
  }
}
