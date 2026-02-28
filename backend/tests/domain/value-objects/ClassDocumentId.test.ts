import { describe, it, expect } from 'vitest';
import { ClassDocumentId } from '@domain/value-objects/ClassDocumentId.js';

describe('ClassDocumentId Value Object', () => {
  it('should create ClassDocumentId without providing value (generates UUID)', () => {
    const classDocumentId = new ClassDocumentId();
    expect(classDocumentId.getValue()).toBeDefined();
    expect(classDocumentId.getValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should create ClassDocumentId with valid UUID string', () => {
    const uuid = '123e4567-e89b-42d3-a456-426614174000';
    const classDocumentId = new ClassDocumentId(uuid);
    expect(classDocumentId.getValue()).toBe(uuid);
  });

  it('should throw error when creating with invalid UUID', () => {
    expect(() => new ClassDocumentId('invalid-uuid')).toThrow(
      'Invalid ClassDocumentId: must be a valid UUID'
    );
  });

  it('should throw error when creating with empty string', () => {
    expect(() => new ClassDocumentId('')).toThrow('Invalid ClassDocumentId: must be a valid UUID');
  });

  it('should check equality correctly', () => {
    const id1 = new ClassDocumentId('123e4567-e89b-12d3-a456-426614174000');
    const id2 = new ClassDocumentId('123e4567-e89b-12d3-a456-426614174000');
    const id3 = new ClassDocumentId('123e4567-e89b-12d3-a456-426614174001');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('should convert to string', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const classDocumentId = new ClassDocumentId(uuid);
    expect(classDocumentId.toString()).toBe(uuid);
  });
});
