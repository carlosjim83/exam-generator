import type { AssignmentId } from '@domain/value-objects/AssignmentId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export enum ExamAssignmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

export interface ExamAssignmentProps {
  id: AssignmentId;
  examId: string;
  studentId: UserId;
  teacherId: UserId;
  status: ExamAssignmentStatus;
  dueDate: Date | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  score: number | null;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ExamAssignment Entity
 * Represents an exam assigned to a student by a teacher
 */
export class ExamAssignment {
  private constructor(private props: ExamAssignmentProps) {}

  static create(props: ExamAssignmentProps): ExamAssignment {
    // Validate initial status
    if (props.status !== ExamAssignmentStatus.PENDING && !props.startedAt) {
      throw new Error('Non-pending assignments must have a startedAt date');
    }

    // Validate submitted/graded assignments
    if (
      (props.status === ExamAssignmentStatus.SUBMITTED ||
        props.status === ExamAssignmentStatus.GRADED) &&
      !props.submittedAt
    ) {
      throw new Error('Submitted/graded assignments must have a submittedAt date');
    }

    // Validate score
    if (props.score !== null && (props.score < 0 || props.score > 100)) {
      throw new Error('Score must be between 0 and 100');
    }

    return new ExamAssignment(props);
  }

  // Getters
  get id(): AssignmentId {
    return this.props.id;
  }

  get examId(): string {
    return this.props.examId;
  }

  get studentId(): UserId {
    return this.props.studentId;
  }

  get teacherId(): UserId {
    return this.props.teacherId;
  }

  get status(): ExamAssignmentStatus {
    return this.props.status;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get submittedAt(): Date | null {
    return this.props.submittedAt;
  }

  get score(): number | null {
    return this.props.score;
  }

  get feedback(): string | null {
    return this.props.feedback;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  canStart(): boolean {
    return this.props.status === ExamAssignmentStatus.PENDING;
  }

  canSubmit(): boolean {
    return this.props.status === ExamAssignmentStatus.IN_PROGRESS;
  }

  isGraded(): boolean {
    return this.props.status === ExamAssignmentStatus.GRADED;
  }

  start(): ExamAssignment {
    if (!this.canStart()) {
      throw new Error(`Cannot start assignment with status ${this.props.status}`);
    }

    return ExamAssignment.create({
      ...this.props,
      status: ExamAssignmentStatus.IN_PROGRESS,
      startedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  submit(score: number): ExamAssignment {
    if (!this.canSubmit()) {
      throw new Error(`Cannot submit assignment with status ${this.props.status}`);
    }

    return ExamAssignment.create({
      ...this.props,
      status: ExamAssignmentStatus.SUBMITTED,
      submittedAt: new Date(),
      score,
      updatedAt: new Date(),
    });
  }

  addFeedback(feedback: string): ExamAssignment {
    if (!this.isGraded()) {
      throw new Error('Can only add feedback to graded assignments');
    }

    return ExamAssignment.create({
      ...this.props,
      feedback,
      updatedAt: new Date(),
    });
  }

  toObject() {
    return {
      id: this.props.id.value,
      examId: this.props.examId,
      studentId: this.props.studentId.value,
      teacherId: this.props.teacherId.value,
      status: this.props.status,
      startedAt: this.props.startedAt,
      submittedAt: this.props.submittedAt,
      score: this.props.score,
      feedback: this.props.feedback,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
