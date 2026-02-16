export class EnrollmentId {
  readonly value: string;

  constructor(value?: string) {
    this.value = value || crypto.randomUUID();

    if (value && !this.isValidUUID(value)) {
      throw new Error('Invalid EnrollmentId: must be a valid UUID');
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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
}
