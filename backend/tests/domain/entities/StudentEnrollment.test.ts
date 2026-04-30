import { describe, it, expect } from 'vitest';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { StudentEnrollmentMother } from '@tests/helpers/factories/StudentEnrollmentMother.js';

describe('StudentEnrollment Entity', () => {
  describe('Creation', () => {
    it('should create active enrollment with default values', () => {
      const enrollment = StudentEnrollmentMother.create();

      expect(enrollment.id).toBeDefined();
      expect(enrollment.classId).toBeDefined();
      expect(enrollment.studentId).toBeDefined();
      expect(enrollment.joinedAt).toBeInstanceOf(Date);
      expect(enrollment.leftAt).toBeNull();
      expect(enrollment.isActive).toBe(true);
    });

    it('should create enrollment with leftAt (inactive)', () => {
      const leftAt = new Date('2024-02-01T10:00:00Z');
      const enrollment = StudentEnrollmentMother.create({ leftAt });

      expect(enrollment.leftAt).toEqual(leftAt);
      expect(enrollment.isActive).toBe(false);
    });

    it('should auto-set inactive when leftAt is provided', () => {
      const enrollment = StudentEnrollmentMother.create({
        leftAt: new Date('2024-02-01T10:00:00Z'),
        isActive: true,
      });

      expect(enrollment.isActive).toBe(false);
    });
  });

  describe('Leave', () => {
    it('should mark enrollment as inactive', () => {
      const enrollment = StudentEnrollmentMother.active();
      const before = new Date();

      enrollment.leave();

      expect(enrollment.isActive).toBe(false);
      expect(enrollment.leftAt).toBeInstanceOf(Date);
      expect(enrollment.leftAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw error when already inactive', () => {
      const enrollment = StudentEnrollmentMother.inactive();

      expect(() => enrollment.leave()).toThrow('Student already left the class');
    });
  });

  describe('Equality', () => {
    it('should be equal when ids match', () => {
      const id = '123e4567-e89b-42d3-a456-426614174000';
      const enrollment1 = StudentEnrollmentMother.create({ id });
      const enrollment2 = StudentEnrollmentMother.create({
        id,
        studentId: 'def76543-e89b-42d3-a456-426614174888',
      });

      expect(enrollment1.equals(enrollment2)).toBe(true);
    });

    it('should not be equal when ids differ', () => {
      const enrollment1 = StudentEnrollmentMother.create({
        id: '123e4567-e89b-42d3-a456-426614174000',
      });
      const enrollment2 = StudentEnrollmentMother.create({
        id: 'def76543-e89b-42d3-a456-426614174888',
      });

      expect(enrollment1.equals(enrollment2)).toBe(false);
    });
  });

  describe('Factory methods', () => {
    it('should create active enrollment', () => {
      const enrollment = StudentEnrollmentMother.active();

      expect(enrollment.isActive).toBe(true);
      expect(enrollment.leftAt).toBeNull();
    });

    it('should create inactive enrollment', () => {
      const enrollment = StudentEnrollmentMother.inactive();

      expect(enrollment.isActive).toBe(false);
      expect(enrollment.leftAt).toBeInstanceOf(Date);
    });

    it('should create multiple enrollments', () => {
      const enrollments = StudentEnrollmentMother.createMany(3);

      expect(enrollments).toHaveLength(3);
      expect(enrollments[0].studentId.value).toBeDefined();
      expect(enrollments[1].studentId.value).toBeDefined();
      expect(enrollments[2].studentId.value).toBeDefined();

      expect(enrollments[0].studentId.value).not.toBe(enrollments[1].studentId.value);
      expect(enrollments[1].studentId.value).not.toBe(enrollments[2].studentId.value);
    });
  });
});
