import { ValidationError } from '@domain/errors/DomainError.js';
/**
 * Email Value Object
 * Represents a valid email address
 */
export class Email {
  private constructor(public readonly value: string) {
    if (!Email.isValid(value)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static create(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
