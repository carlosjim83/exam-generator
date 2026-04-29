import { ConflictError } from '@domain/errors/DomainError.js';
import type { ClassId } from '@domain/value-objects/ClassId.js';
import type { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import type { UserId } from '@domain/value-objects/UserId.js';

export class StudentEnrollment {
  readonly id: EnrollmentId;
  readonly classId: ClassId;
  readonly studentId: UserId;
  readonly joinedAt: Date;
  private _leftAt: Date | null;
  private _isActive: boolean;

  constructor(
    id: EnrollmentId,
    classId: ClassId,
    studentId: UserId,
    joinedAt: Date = new Date(),
    leftAt: Date | null = null,
    isActive = true
  ) {
    this.id = id;
    this.classId = classId;
    this.studentId = studentId;
    this.joinedAt = joinedAt;
    this._leftAt = leftAt;
    this._isActive = isActive && !leftAt;
  }

  get leftAt(): Date | null {
    return this._leftAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  leave(): void {
    if (!this._isActive) {
      throw new ConflictError('Student already left the class');
    }
    this._leftAt = new Date();
    this._isActive = false;
  }

  equals(other: StudentEnrollment): boolean {
    return this.id.equals(other.id);
  }
}
