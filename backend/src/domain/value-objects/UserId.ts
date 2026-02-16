import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * UserId Value Object
 * Represents a unique identifier for a User
 */
export class UserId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }

    if (!uuidValidate(value)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  static create(value: string): UserId {
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
