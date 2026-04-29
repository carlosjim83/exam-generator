import { ValidationError } from '@domain/errors/DomainError.js';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class EnrollmentId {
  readonly value: string;

  constructor(value?: string) {
    this.value = value || uuidv4();

    if (value && !uuidValidate(value)) {
      throw new ValidationError('Invalid EnrollmentId: must be a valid UUID');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EnrollmentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): EnrollmentId {
    return new EnrollmentId(value);
  }
}
