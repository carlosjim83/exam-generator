/**
 * DocumentId Value Object
 * Represents a unique identifier for a Document
 */
export class DocumentId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('DocumentId cannot be empty');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('DocumentId must be a valid UUID');
    }
  }

  static create(value: string): DocumentId {
    return new DocumentId(value);
  }

  equals(other: DocumentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
