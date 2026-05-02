import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { Invitation } from '@domain/entities/Invitation.js';
import { InvitationMother } from '@tests/helpers/factories/InvitationMother.js';

describe('Invitation Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ... rest of tests ...
  describe('Creation', () => {
    it('should create pending invitation with default values', () => {
      const invitation = InvitationMother.create();

      expect(invitation.id).toBeDefined();
      expect(invitation.classId).toBeDefined();
      expect(invitation.teacherId).toBeDefined();
      expect(invitation.email).toBe('student@example.com');
      expect(invitation.status).toBe('PENDING');
      expect(invitation.token).toBeDefined();
      expect(invitation.expiresAt).toBeInstanceOf(Date);
      expect(invitation.createdAt).toBeInstanceOf(Date);
      expect(invitation.acceptedAt).toBeNull();
    });

    it('should create invitation with optional fields', () => {
      const invitation = InvitationMother.create({
        email: 'john@example.com',
      });

      expect(invitation.email).toBe('john@example.com');
    });
  });

  describe('Validation', () => {
    it('should throw error when email is empty', () => {
      expect(() => InvitationMother.create({ email: '' })).toThrow('Invalid email address');
    });

    it('should throw error when email is invalid', () => {
      expect(() => InvitationMother.create({ email: 'not-an-email' })).toThrow(
        'Invalid email address'
      );
    });

    it('should throw error when token is too short', () => {
      expect(() => InvitationMother.create({ token: 'short' })).toThrow(
        'Token must be at least 10 characters'
      );
    });
  });

  describe('Accept', () => {
    it('should mark invitation as accepted', () => {
      const invitation = InvitationMother.pending();
      const before = new Date();

      invitation.accept();

      expect(invitation.status).toBe('ACCEPTED');
      expect(invitation.acceptedAt).toBeInstanceOf(Date);
      expect(invitation.acceptedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw error when already accepted', () => {
      const invitation = InvitationMother.accepted();

      expect(() => invitation.accept()).toThrow('Invitation is not pending');
    });

    it('should mark as expired and throw when invitation has expired', () => {
      const invitation = InvitationMother.expired();

      expect(() => invitation.accept()).toThrow('Invitation has expired');
      expect(invitation.status).toBe('EXPIRED');
    });
  });

  describe('Revoke', () => {
    it('should mark invitation as revoked', () => {
      const invitation = InvitationMother.pending();

      invitation.revoke();

      expect(invitation.status).toBe('REVOKED');
    });

    it('should throw error when trying to revoke accepted invitation', () => {
      const invitation = InvitationMother.accepted();

      expect(() => invitation.revoke()).toThrow('Cannot revoke accepted invitation');
    });
  });

  describe('Validation Helpers', () => {
    it('should return true when invitation is valid (pending and not expired)', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const invitation = InvitationMother.create({
        expiresAt: tomorrow,
      });

      expect(invitation.isValid()).toBe(true);
      expect(invitation.isExpired()).toBe(false);
    });

    it('should return false when invitation is expired', () => {
      const invitation = InvitationMother.expired();

      expect(invitation.isExpired()).toBe(true);
      expect(invitation.isValid()).toBe(false);
      expect(invitation.status).toBe('PENDING'); // Status is still PENDING until accept() is called
    });

    it('should return false when invitation is not pending', () => {
      const invitation = InvitationMother.accepted();

      expect(invitation.isValid()).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal when ids match', () => {
      const id = '123e4567-e89b-42d3-a456-426614174000';
      const invitation1 = InvitationMother.create({ id });
      const invitation2 = InvitationMother.create({
        id,
        email: 'different@example.com',
      });

      expect(invitation1.equals(invitation2)).toBe(true);
    });

    it('should not be equal when ids differ', () => {
      const invitation1 = InvitationMother.create({
        id: '123e4567-e89b-42d3-a456-426614174000',
      });
      const invitation2 = InvitationMother.create({
        id: 'def76543-e89b-42d3-a456-426614174888',
      });

      expect(invitation1.equals(invitation2)).toBe(false);
    });
  });

  describe('Factory methods', () => {
    it('should create pending invitation', () => {
      const invitation = InvitationMother.pending();

      expect(invitation.status).toBe('PENDING');
    });

    it('should create accepted invitation', () => {
      const invitation = InvitationMother.accepted();

      expect(invitation.status).toBe('ACCEPTED');
      expect(invitation.acceptedAt).toBeInstanceOf(Date);
    });

    it('should create expired invitation', () => {
      const invitation = InvitationMother.expired();

      expect(invitation.isExpired()).toBe(true);
      expect(invitation.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it('should create revoked invitation', () => {
      const invitation = InvitationMother.revoked();

      expect(invitation.status).toBe('REVOKED');
    });

    it('should create multiple invitations', () => {
      const invitations = InvitationMother.createMany(5);

      expect(invitations).toHaveLength(5);
      invitations.forEach((inv) => {
        expect(inv.email).toBe('student@example.com');
      });

      // All should have different tokens
      const tokens = invitations.map((inv) => inv.token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });
});
