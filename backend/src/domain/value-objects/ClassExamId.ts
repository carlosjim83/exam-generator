import { ValidationError } from '@domain/errors/DomainError.js';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * ClassExamId Value Object
 * Represents a unique identifier for a ClassExam entity
 */
export class ClassExamId {
  readonly value: string;

  constructor(value?: string) {
    if (value === undefined) {
      this.value = uuidv4();
    } else {
      if (!value || value.trim().length === 0) {
        throw new ValidationError('Invalid ClassExamId: must be a valid UUID');
      }

      if (!uuidValidate(value)) {
        throw new ValidationError('Invalid ClassExamId: must be a valid UUID');
      }

      this.value = value;
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ClassExamId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): ClassExamId {
    return new ClassExamId(value);
  }

  static create(value: string): ClassExamId {
    return new ClassExamId(value);
  }
}
