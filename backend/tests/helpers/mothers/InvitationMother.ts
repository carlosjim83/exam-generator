/**
 * Invitation Object Mother
 * Provides pre-configured Invitation entities for testing
 *
 * Pattern: Object Mother
 * Purpose: Centralize invitation creation with valid defaults
 */

import { Invitation } from '@domain/entities/Invitation.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { v4 as uuidv4 } from 'uuid';

export interface InvitationMotherOptions {
  id?: string;
  classId?: string;
  teacherId?: string;
  email?: string;
  status?: Invitation['status'];
  token?: string;
  expiresAt?: Date;
  acceptedAt?: Date | null;
  createdAt?: Date;
}

/**
 * Invitation Mother - Creates test Invitation entities
 */
export class InvitationMother {
  /**
   * Creates a basic invitation with default values
   */
  static create(overrides: InvitationMotherOptions = {}): Invitation {
    const now = new Date();
    const defaults: InvitationMotherOptions = {
      classId: '123e4567-e89b-42d3-a456-426614174000',
      teacherId: '987e6543-e89b-42d3-a456-426614174111',
      email: 'student@example.com',
      status: 'PENDING',
      token: uuidv4(),
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    };

    const options = { ...defaults, ...overrides };

    return new Invitation(
      options.id ? new InvitationId(options.id) : new InvitationId(),
      new ClassId(options.classId!),
      UserId.create(options.teacherId!),
      options.email!,
      options.token!,
      options.expiresAt!,
      options.status!,
      options.acceptedAt,
      options.createdAt!
    );
  }

  /**
   * Creates multiple invitations
   */
  static createMany(count: number, overrides: InvitationMotherOptions = {}): Invitation[] {
    const baseEmail = overrides.email || 'student@example.com';

    return Array.from({ length: count }, (_, i) =>
      this.create({
        ...overrides,
        email: baseEmail,
        token: uuidv4(),
      })
    );
  }

  /**
   * Creates a pending invitation
   */
  static pending(overrides: InvitationMotherOptions = {}): Invitation {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.create({
      status: 'PENDING',
      createdAt: now,
      expiresAt: expires,
      ...overrides,
    });
  }

  /**
   * Creates an accepted invitation
   */
  static accepted(overrides: InvitationMotherOptions = {}): Invitation {
    const now = new Date();
    const accepted = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const created = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    return this.create({
      status: 'ACCEPTED',
      acceptedAt: accepted,
      createdAt: created,
      expiresAt: new Date(accepted.getTime() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  }

  /**
   * Creates an expired invitation (with past expiration)
   * Note: Creates a PENDING invitation with expiresAt in the past
   * so that isExpired() returns true
   */
  static expired(overrides: InvitationMotherOptions = {}): Invitation {
    // Use hardcoded dates that work with fake timers set to 2024-01-15
    const created = new Date('2024-01-15T10:00:00Z');
    const expires = new Date('2024-01-14T10:00:00Z'); // 1 day ago (expired)

    return this.create({
      status: 'PENDING',
      createdAt: created,
      expiresAt: expires,
      ...overrides,
    });
  }

  /**
   * Creates a revoked invitation
   */
  static revoked(overrides: InvitationMotherOptions = {}): Invitation {
    const now = new Date();

    return this.create({
      status: 'REVOKED',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  }
}
