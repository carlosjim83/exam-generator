import { describe, it, expect } from 'vitest';
import { Class } from '@domain/entities/Class.js';
import { ClassMother } from '@tests/helpers/mothers/ClassMother.js';

describe('Class Entity', () => {
  describe('Creation', () => {
    it('should create class with required fields', () => {
      const classEntity = ClassMother.create();

      expect(classEntity.id).toBeDefined();
      expect(classEntity.teacherId).toBeDefined();
      expect(classEntity.name).toBe('Math 101');
      expect(classEntity.code).toBe('MAT101');
      expect(classEntity.description).toBeNull();
      expect(classEntity.color).toBeNull();
      expect(classEntity.createdAt).toBeInstanceOf(Date);
    });

    it('should create class with optional fields', () => {
      const classEntity = ClassMother.create({
        description: 'Advanced mathematics',
        color: '#FF5733',
      });

      expect(classEntity.description).toBe('Advanced mathematics');
      expect(classEntity.color).toBe('#FF5733');
    });

    it('should create class with default createdAt when not provided', () => {
      const before = new Date();
      const classEntity = ClassMother.create({ createdAt: undefined });
      const after = new Date();

      expect(classEntity.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(classEntity.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Validation', () => {
    it('should throw error when name is empty', () => {
      expect(() => ClassMother.create({ name: '' })).toThrow('Class name cannot be empty');
    });

    it('should throw error when name is whitespace only', () => {
      expect(() => ClassMother.create({ name: '   ' })).toThrow('Class name cannot be empty');
    });

    it('should throw error when name exceeds 255 characters', () => {
      const longName = 'a'.repeat(256);
      expect(() => ClassMother.create({ name: longName })).toThrow(
        'Class name cannot exceed 255 characters'
      );
    });

    it('should throw error when code is less than 6 characters', () => {
      expect(() => ClassMother.create({ code: 'MAT12' })).toThrow(
        'Class code must be 6-8 characters'
      );
    });

    it('should throw error when code is more than 8 characters', () => {
      expect(() => ClassMother.create({ code: 'MAT101234' })).toThrow(
        'Class code must be 6-8 characters'
      );
    });

    it('should throw error when color has invalid format', () => {
      expect(() => ClassMother.create({ color: 'invalid' })).toThrow('Invalid color format');
    });

    it('should throw error when color is missing hash', () => {
      expect(() => ClassMother.create({ color: 'FF5733' })).toThrow('Invalid color format');
    });

    it('should throw error when description exceeds 5000 characters', () => {
      const longDesc = 'a'.repeat(5001);
      expect(() => ClassMother.create({ description: longDesc })).toThrow(
        'Description cannot exceed 5000 characters'
      );
    });
  });

  describe('Getters', () => {
    it('should return name', () => {
      const classEntity = ClassMother.create();
      expect(classEntity.name).toBe('Math 101');
    });

    it('should return description', () => {
      const classEntity = ClassMother.create({ description: 'Description' });
      expect(classEntity.description).toBe('Description');
    });

    it('should return null when no description', () => {
      const classEntity = ClassMother.create();
      expect(classEntity.description).toBeNull();
    });

    it('should return code', () => {
      const classEntity = ClassMother.create();
      expect(classEntity.code).toBe('MAT101');
    });

    it('should return color', () => {
      const classEntity = ClassMother.create({ color: '#FF5733' });
      expect(classEntity.color).toBe('#FF5733');
    });

    it('should return null when no color', () => {
      const classEntity = ClassMother.create();
      expect(classEntity.color).toBeNull();
    });

    it('should return updatedAt', () => {
      const classEntity = ClassMother.create();
      expect(classEntity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Equality', () => {
    it('should be equal when ids match', () => {
      const classId = '123e4567-e89b-42d3-a456-426614174000';
      const class1 = ClassMother.create({ id: classId });
      const class2 = ClassMother.create({ id: classId, name: 'History', code: 'HIS101' });

      expect(class1.equals(class2)).toBe(true);
    });

    it('should not be equal when ids differ', () => {
      const class1 = ClassMother.create({ id: '123e4567-e89b-42d3-a456-426614174000' });
      const class2 = ClassMother.create({ id: 'def76543-e89b-42d3-a456-426614174888' });

      expect(class1.equals(class2)).toBe(false);
    });
  });

  describe('Factory methods', () => {
    it('should create math class', () => {
      const classEntity = ClassMother.math();

      expect(classEntity.name).toBe('Mathematics 101');
      expect(classEntity.code).toBe('MAT101');
      expect(classEntity.description).toBe('Introduction to algebra and calculus');
      expect(classEntity.color).toBe('#FF5733');
    });

    it('should create history class', () => {
      const classEntity = ClassMother.history();

      expect(classEntity.name).toBe('World History');
      expect(classEntity.code).toBe('HIS101');
      expect(classEntity.description).toBe('Ancient to modern history');
      expect(classEntity.color).toBe('#33FF57');
    });

    it('should create science class', () => {
      const classEntity = ClassMother.science();

      expect(classEntity.name).toBe('Physics 101');
      expect(classEntity.code).toBe('PHY101');
      expect(classEntity.description).toBe('Classical mechanics and thermodynamics');
      expect(classEntity.color).toBe('#3357FF');
    });

    it('should create multiple classes', () => {
      const classes = ClassMother.createMany(3);

      expect(classes).toHaveLength(3);
      expect(classes[0].name).toBe('Class 1');
      expect(classes[1].name).toBe('Class 2');
      expect(classes[2].name).toBe('Class 3');
    });
  });
});
