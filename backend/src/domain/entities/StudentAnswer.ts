import { AssignmentId } from '../value-objects/AssignmentId.js';

export interface StudentAnswerProps {
  id: string;
  assignmentId: AssignmentId;
  questionId: string;
  answerText: string;
  isCorrect: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * StudentAnswer Entity
 * Represents a single answer from a student for a specific question
 */
export class StudentAnswer {
  private constructor(private props: StudentAnswerProps) {}

  static create(props: StudentAnswerProps): StudentAnswer {
    if (!props.answerText || props.answerText.trim().length === 0) {
      throw new Error('Answer text cannot be empty');
    }

    return new StudentAnswer(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assignmentId(): AssignmentId {
    return this.props.assignmentId;
  }

  get questionId(): string {
    return this.props.questionId;
  }

  get answerText(): string {
    return this.props.answerText;
  }

  get isCorrect(): boolean | null {
    return this.props.isCorrect;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  grade(correctAnswer: string): StudentAnswer {
    const isCorrect = this.props.answerText.trim() === correctAnswer.trim();

    return StudentAnswer.create({
      ...this.props,
      isCorrect,
      updatedAt: new Date(),
    });
  }

  toObject() {
    return {
      id: this.props.id,
      assignmentId: this.props.assignmentId.value,
      questionId: this.props.questionId,
      answerText: this.props.answerText,
      isCorrect: this.props.isCorrect,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
