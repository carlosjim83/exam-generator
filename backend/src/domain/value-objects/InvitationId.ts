import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class InvitationId {
  readonly value: string;

  constructor(value?: string) {
    this.value = value || uuidv4();

    if (value && !uuidValidate(value)) {
      throw new Error('Invalid InvitationId: must be a valid UUID');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InvitationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): InvitationId {
    return new InvitationId(value);
  }

  static create(value: string): InvitationId {
    return new InvitationId(value);
  }
}
