import { describe, it, expect } from 'vitest';
import { ClassId } from '@domain/value-objects/ClassId.js';

describe('ClassId Value Object', () => {
  it('should create ClassId without providing value (generates UUID)', () => {
    const classId = new ClassId();
    expect(classId.getValue()).toBeDefined();
    expect(classId.getValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should create ClassId with valid UUID string', () => {
    const uuid = '123e4567-e89b-42d3-a456-426614174000';
    const classId = new ClassId(uuid);
    expect(classId.getValue()).toBe(uuid);
  });

  it('should throw error when creating with invalid UUID', () => {
    expect(() => new ClassId('invalid-uuid')).toThrow('Invalid ClassId: must be a valid UUID');
  });

  it('should throw error when creating with empty string', () => {
    expect(() => new ClassId('')).toThrow('Invalid ClassId: must be a valid UUID');
  });

  it('should check equality correctly', () => {
    const id1 = new ClassId('123e4567-e89b-12d3-a456-426614174000');
    const id2 = new ClassId('123e4567-e89b-12d3-a456-426614174000');
    const id3 = new ClassId('123e4567-e89b-12d3-a456-426614174001');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('should convert to string', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const classId = new ClassId(uuid);
    expect(classId.toString()).toBe(uuid);
  });
});
