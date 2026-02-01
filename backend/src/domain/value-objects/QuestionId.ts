/**
 * QuestionId - Value Object
 * Represents a unique identifier for a Question
 */

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class QuestionId {
  private constructor(public readonly value: string) {
    if (!uuidValidate(value)) {
      throw new Error(`Invalid QuestionId: ${value} must be a valid UUID`);
    }
  }

  static create(value?: string): QuestionId {
    return new QuestionId(value || uuidv4());
  }

  equals(other: QuestionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
