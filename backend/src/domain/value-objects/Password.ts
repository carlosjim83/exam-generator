/**
 * Password Value Object
 * Represents a valid password (minimum 8 characters)
 */
export class Password {
  private constructor(public readonly value: string) {
    if (!Password.isValid(value)) {
      throw new Error('Password must be at least 8 characters long');
    }
  }

  static create(value: string): Password {
    return new Password(value);
  }

  static isValid(password: string): boolean {
    return !!password && password.length >= 8;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return '***REDACTED***'; // Never log passwords
  }
}
