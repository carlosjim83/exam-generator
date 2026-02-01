/**
 * ExamId - Value Object
 * Represents a unique identifier for an Exam
 */

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class ExamId {
  private constructor(public readonly value: string) {
    if (!uuidValidate(value)) {
      throw new Error(`Invalid ExamId: ${value} must be a valid UUID`);
    }
  }

  static create(value?: string): ExamId {
    return new ExamId(value || uuidv4());
  }

  equals(other: ExamId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
