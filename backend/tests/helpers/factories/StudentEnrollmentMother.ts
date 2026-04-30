/**
 * StudentEnrollment Object Mother
 * Provides pre-configured StudentEnrollment entities for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize enrollment creation with valid defaults
 */

import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { v4 as uuidv4 } from 'uuid';

export interface StudentEnrollmentMotherOptions {
  id?: string;
  classId?: string;
  studentId?: string;
  joinedAt?: Date;
  leftAt?: Date | null;
  isActive?: boolean;
}

/**
 * StudentEnrollment Mother - Creates test StudentEnrollment entities
 */
export class StudentEnrollmentMother {
  /**
   * Creates a basic enrollment with default values
   */
  static create(overrides: StudentEnrollmentMotherOptions = {}): StudentEnrollment {
    const defaults: StudentEnrollmentMotherOptions = {
      classId: '123e4567-e89b-42d3-a456-426614174000',
      studentId: '987e6543-e89b-42d3-a456-426614174888',
      joinedAt: new Date('2024-01-15T10:00:00Z'),
      leftAt: null,
      isActive: true,
    };

    const options = { ...defaults, ...overrides };

    return new StudentEnrollment(
      options.id ? new EnrollmentId(options.id) : new EnrollmentId(),
      new ClassId(options.classId!),
      UserId.create(options.studentId!),
      options.joinedAt!,
      options.leftAt,
      options.isActive!
    );
  }

  /**
   * Creates multiple enrollments
   */
  static createMany(
    count: number,
    overrides: StudentEnrollmentMotherOptions = {}
  ): StudentEnrollment[] {
    return Array.from({ length: count }, (_, i) => {
      const uniqueStudentId = overrides.studentId
        ? i === 0
          ? overrides.studentId
          : undefined
        : uuidv4();

      return this.create({
        ...overrides,
        studentId: uniqueStudentId,
        joinedAt: new Date(`2024-01-${(15 + i).toString().padStart(2, '0')}T10:00:00Z`),
      });
    });
  }

  /**
   * Creates an active enrollment
   */
  static active(overrides: StudentEnrollmentMotherOptions = {}): StudentEnrollment {
    return this.create({
      isActive: true,
      leftAt: null,
      ...overrides,
    });
  }

  /**
   * Creates an inactive enrollment (student left)
   */
  static inactive(overrides: StudentEnrollmentMotherOptions = {}): StudentEnrollment {
    return this.create({
      isActive: false,
      leftAt: new Date('2024-02-01T10:00:00Z'),
      ...overrides,
    });
  }
}
