/**
 * Domain User Mother
 * Provides pre-configured User domain entities for unit testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize domain entity creation for unit tests (no HTTP calls)
 */

import { User, UserRole, AuthProvider } from '@domain/entities/User.js';
import { Email } from '@domain/value-objects/Email.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface DomainUserMotherOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  passwordHash?: string | null;
  role?: UserRole;
  provider?: AuthProvider;
  providerId?: string | null;
  refreshTokenVersion?: number;
}

export class DomainUserMother {
  static teacher(overrides: DomainUserMotherOptions = {}): User {
    return this.create({
      role: UserRole.TEACHER,
      ...overrides,
    });
  }

  static student(overrides: DomainUserMotherOptions = {}): User {
    return this.create({
      role: UserRole.STUDENT,
      ...overrides,
    });
  }

  static oauth(overrides: DomainUserMotherOptions = {}): User {
    return this.create({
      provider: AuthProvider.GOOGLE,
      passwordHash: null,
      ...overrides,
    });
  }

  static create(overrides: DomainUserMotherOptions = {}): User {
    const now = new Date();
    const id = overrides.id ?? '00000000-0000-0000-0000-000000000001';
    const email = overrides.email ?? 'test@example.com';

    const props = {
      id: UserId.create(id),
      email: Email.create(email),
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      passwordHash:
        overrides.passwordHash !== undefined ? overrides.passwordHash : 'hashed_password',
      role: overrides.role ?? UserRole.TEACHER,
      provider: overrides.provider ?? AuthProvider.LOCAL,
      providerId: overrides.providerId ?? null,
      refreshTokenVersion: overrides.refreshTokenVersion ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    return User.create(props);
  }
}
