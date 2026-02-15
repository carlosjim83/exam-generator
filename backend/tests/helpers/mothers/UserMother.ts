/**
 * User Object Mother
 * Provides pre-configured user objects for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize user creation with authentication tokens
 */

import { FastifyInstance } from 'fastify';

export interface UserMotherOptions {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: 'TEACHER' | 'STUDENT';
}

export interface UserMotherResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * User Mother - Creates test users with authentication
 */
export class UserMother {
  /**
   * Creates a teacher user (default)
   */
  static async teacher(
    app: FastifyInstance,
    overrides: Partial<UserMotherOptions> = {}
  ): Promise<UserMotherResult> {
    return this.create(app, {
      firstName: 'Teacher',
      lastName: 'Test',
      role: 'TEACHER',
      ...overrides,
    });
  }

  /**
   * Creates a student user
   */
  static async student(
    app: FastifyInstance,
    overrides: Partial<UserMotherOptions> = {}
  ): Promise<UserMotherResult> {
    return this.create(app, {
      firstName: 'Student',
      lastName: 'Test',
      role: 'STUDENT',
      ...overrides,
    });
  }

  /**
   * Creates multiple teachers
   */
  static async teachers(app: FastifyInstance, count: number): Promise<UserMotherResult[]> {
    const promises = Array.from({ length: count }, (_, i) =>
      this.teacher(app, {
        email: this.uniqueEmail(`teacher-${i}`),
        firstName: `Teacher${i + 1}`,
      })
    );
    return Promise.all(promises);
  }

  /**
   * Creates multiple students
   */
  static async students(app: FastifyInstance, count: number): Promise<UserMotherResult[]> {
    const promises = Array.from({ length: count }, (_, i) =>
      this.student(app, {
        email: this.uniqueEmail(`student-${i}`),
        firstName: `Student${i + 1}`,
      })
    );
    return Promise.all(promises);
  }

  /**
   * Base factory method - registers user via API and returns tokens
   */
  static async create(app: FastifyInstance, options: UserMotherOptions): Promise<UserMotherResult> {
    const defaults = {
      firstName: 'Test',
      lastName: 'User',
      email: this.uniqueEmail('test'),
      password: 'TestPassword123!',
      role: 'TEACHER' as const,
    };

    const data = { ...defaults, ...options };

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: data,
    });

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create user: ${response.statusCode} ${response.body}`);
    }

    const body = JSON.parse(response.body);

    return {
      user: {
        id: body.user.id,
        email: body.user.email,
        firstName: body.user.firstName,
        lastName: body.user.lastName,
        role: body.user.role,
      },
      tokens: {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
      },
    };
  }

  /**
   * Generates unique email to avoid conflicts
   */
  static uniqueEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${timestamp}-${random}@example.com`;
  }
}
