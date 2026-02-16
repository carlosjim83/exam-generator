/**
 * Class Object Mother
 * Provides pre-configured Class entities for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize class creation with valid defaults
 */

import { Class } from '@domain/entities/Class.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface ClassMotherOptions {
  id?: string;
  teacherId?: string;
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  createdAt?: Date;
}

/**
 * Class Mother - Creates test Class entities
 */
export class ClassMother {
  /**
   * Creates a basic class with default values
   */
  static create(overrides: ClassMotherOptions = {}): Class {
    return this.withTeacher('123e4567-e89b-42d3-a456-426614174000', overrides);
  }

  /**
   * Creates a class for a specific teacher
   */
  static withTeacher(teacherId: string, overrides: ClassMotherOptions = {}): Class {
    const defaults: ClassMotherOptions = {
      teacherId,
      name: 'Math 101',
      code: 'MAT101',
      description: null,
      color: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    const options = { ...defaults, ...overrides };

    return new Class(
      options.id ? new ClassId(options.id) : new ClassId(),
      UserId.create(options.teacherId!),
      options.name!,
      options.code!,
      options.description,
      options.color,
      options.createdAt
    );
  }

  /**
   * Creates multiple classes
   */
  static createMany(count: number, overrides: ClassMotherOptions = {}): Class[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        ...overrides,
        name: overrides.name || `Class ${i + 1}`,
        code: overrides.code || `CLS${(i + 1).toString().padStart(3, '0')}`,
      })
    );
  }

  /**
   * Creates a Math class
   */
  static math(overrides: ClassMotherOptions = {}): Class {
    return this.create({
      name: 'Mathematics 101',
      code: 'MAT101',
      description: 'Introduction to algebra and calculus',
      color: '#FF5733',
      ...overrides,
    });
  }

  /**
   * Creates a History class
   */
  static history(overrides: ClassMotherOptions = {}): Class {
    return this.create({
      name: 'World History',
      code: 'HIS101',
      description: 'Ancient to modern history',
      color: '#33FF57',
      ...overrides,
    });
  }

  /**
   * Creates a Science class
   */
  static science(overrides: ClassMotherOptions = {}): Class {
    return this.create({
      name: 'Physics 101',
      code: 'PHY101',
      description: 'Classical mechanics and thermodynamics',
      color: '#3357FF',
      ...overrides,
    });
  }
}
