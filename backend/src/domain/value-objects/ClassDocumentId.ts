import { ValidationError } from '@domain/errors/DomainError.js';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class ClassDocumentId {
  readonly value: string;

  constructor(value?: string) {
    if (value === undefined) {
      this.value = uuidv4();
    } else {
      if (!value || value.trim().length === 0) {
        throw new ValidationError('Invalid ClassDocumentId: must be a valid UUID');
      }

      if (!uuidValidate(value)) {
        throw new ValidationError('Invalid ClassDocumentId: must be a valid UUID');
      }

      this.value = value;
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ClassDocumentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): ClassDocumentId {
    return new ClassDocumentId(value);
  }

  static create(value: string): ClassDocumentId {
    return new ClassDocumentId(value);
  }
}
