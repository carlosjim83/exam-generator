import { ValidationError } from '@domain/errors/DomainError.js';
/**
 * AssignmentId Value Object
 * Represents a unique identifier for an ExamAssignment
 */
export class AssignmentId {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new ValidationError('AssignmentId cannot be empty');
    }
  }

  static create(value: string): AssignmentId {
    return new AssignmentId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: AssignmentId): boolean {
    return this._value === other._value;
  }
}
