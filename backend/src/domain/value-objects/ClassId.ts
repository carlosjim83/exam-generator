import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class ClassId {
  readonly value: string;

  constructor(value?: string) {
    if (value === undefined) {
      this.value = uuidv4();
    } else {
      if (!value || value.trim().length === 0) {
        throw new Error('Invalid ClassId: must be a valid UUID');
      }

      if (!uuidValidate(value)) {
        throw new Error('Invalid ClassId: must be a valid UUID');
      }

      this.value = value;
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ClassId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): ClassId {
    return new ClassId(value);
  }

  static create(value: string): ClassId {
    return new ClassId(value);
  }
}
