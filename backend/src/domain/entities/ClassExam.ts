import { ValidationError } from '@domain/errors/DomainError.js';
import type { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export interface ClassExamProps {
  id: ClassExamId;
  classId: ClassId;
  examId: string;
  teacherId: UserId;
  availableAt: Date | null;
  dueDate: Date | null;
  timeLimit: number | null; // minutes, null = unlimited
  isPublished: boolean;
  maxAttempts: number;
  showResultsImmediately: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ClassExam Entity
 * Represents an exam assigned to a class with specific settings
 */
export class ClassExam {
  private constructor(private props: ClassExamProps) {}

  static create(props: ClassExamProps): ClassExam {
    // Validate time limit
    if (props.timeLimit !== null && props.timeLimit < 1) {
      throw new ValidationError('Time limit must be at least 1 minute');
    }

    // Validate max attempts
    if (props.maxAttempts < 1) {
      throw new ValidationError('Max attempts must be at least 1');
    }

    // Validate dates
    if (props.availableAt && props.dueDate && props.availableAt >= props.dueDate) {
      throw new ValidationError('Available date must be before due date');
    }

    return new ClassExam(props);
  }

  // Getters
  get id(): ClassExamId {
    return this.props.id;
  }

  get classId(): ClassId {
    return this.props.classId;
  }

  get examId(): string {
    return this.props.examId;
  }

  get teacherId(): UserId {
    return this.props.teacherId;
  }

  get availableAt(): Date | null {
    return this.props.availableAt;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get timeLimit(): number | null {
    return this.props.timeLimit;
  }

  get isPublished(): boolean {
    return this.props.isPublished;
  }

  get maxAttempts(): number {
    return this.props.maxAttempts;
  }

  get showResultsImmediately(): boolean {
    return this.props.showResultsImmediately;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic
  isAvailable(): boolean {
    if (!this.props.isPublished) return false;
    if (!this.props.availableAt) return true;
    return new Date() >= this.props.availableAt;
  }

  isPastDue(): boolean {
    if (!this.props.dueDate) return false;
    return new Date() > this.props.dueDate;
  }

  canBeStarted(): boolean {
    return this.isAvailable() && !this.isPastDue();
  }

  // Update methods
  publish(): ClassExam {
    return ClassExam.create({
      ...this.props,
      isPublished: true,
      updatedAt: new Date(),
    });
  }

  unpublish(): ClassExam {
    return ClassExam.create({
      ...this.props,
      isPublished: false,
      updatedAt: new Date(),
    });
  }

  updateSettings(
    settings: Partial<{
      availableAt: Date | null;
      dueDate: Date | null;
      timeLimit: number | null;
      maxAttempts: number;
      showResultsImmediately: boolean;
    }>
  ): ClassExam {
    return ClassExam.create({
      ...this.props,
      ...settings,
      updatedAt: new Date(),
    });
  }

  toObject() {
    return {
      id: this.props.id.value,
      classId: this.props.classId.toString(),
      examId: this.props.examId,
      teacherId: this.props.teacherId.value,
      availableAt: this.props.availableAt?.toISOString() ?? null,
      dueDate: this.props.dueDate?.toISOString() ?? null,
      timeLimit: this.props.timeLimit,
      isPublished: this.props.isPublished,
      maxAttempts: this.props.maxAttempts,
      showResultsImmediately: this.props.showResultsImmediately,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
