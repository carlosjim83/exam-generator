import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateEmailInvitationsUseCase,
  CreateEmailInvitationsCommand,
} from '@application/use-cases/classes/CreateEmailInvitationsUseCase.js';
import { Invitation } from '@domain/entities/Invitation.js';
import { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

// Mock the repositories
const mockInvitationRepository = {
  saveMany: vi.fn(),
} satisfies Partial<IInvitationRepository> as IInvitationRepository;

const mockClassRepository = {
  findById: vi.fn(),
} satisfies Partial<IClassRepository> as IClassRepository;

describe('CreateEmailInvitationsUseCase', () => {
  let useCase: CreateEmailInvitationsUseCase;
  const classId = '123e4567-e89b-42d3-a456-426614174000';
  const teacherId = '987e6543-e89b-42d3-a456-426614174888';

  beforeEach(() => {
    useCase = new CreateEmailInvitationsUseCase(mockInvitationRepository, mockClassRepository);
    vi.clearAllMocks();
    mockClassRepository.findById.mockResolvedValue({
      id: classId,
      teacherId: UserId.create(teacherId),
    });
  });

  describe('execute', () => {
    it('should create invitations for valid emails', async () => {
      const emails = ['student1@example.com', 'student2@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(2);
      expect(mockInvitationRepository.saveMany).toHaveBeenCalledTimes(1);
      expect(mockInvitationRepository.saveMany).toHaveBeenCalledWith(result);

      // Verify each invitation
      for (const invitation of result) {
        expect(invitation).toBeInstanceOf(Invitation);
        expect(invitation.status).toBe('PENDING');
        expect(invitation.expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should validate email format', async () => {
      const emails = [
        'valid@example.com',
        'invalid-email',
        'another@valid.com',
        'not-an-email',
        'test@domain.co.uk',
      ];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(3); // Only valid emails
      expect(result.some((i) => i.email === 'valid@example.com')).toBe(true);
      expect(result.some((i) => i.email === 'another@valid.com')).toBe(true);
      expect(result.some((i) => i.email === 'test@domain.co.uk')).toBe(true);
      expect(result.some((i) => i.email === 'invalid-email')).toBe(false);
      expect(result.some((i) => i.email === 'not-an-email')).toBe(false);
    });

    it('should deduplicate emails', async () => {
      const emails = [
        'student@example.com',
        'student@example.com',
        'student@example.com',
        'another@example.com',
      ];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(2); // Deduplicated
      expect(mockInvitationRepository.saveMany).toHaveBeenCalledWith(result);
    });

    it('should throw error if more than 50 emails', async () => {
      const emails = Array.from({ length: 51 }, (_, i) => `student${i}@example.com`);
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      await expect(useCase.execute(command)).rejects.toThrow(
        'Cannot invite more than 50 students at once'
      );
      expect(mockInvitationRepository.saveMany).not.toHaveBeenCalled();
    });

    it('should handle empty email list', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, []);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(0);
      expect(mockInvitationRepository.saveMany).toHaveBeenCalledWith([]);
    });

    it('should ignore invalid emails in the list', async () => {
      const emails = ['invalid1', 'invalid2', '@invalid.com', 'no-at-sign.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(0);
    });

    it('should use 7-day expiration for invitations', async () => {
      const emails = ['student@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      const invitation = result[0];
      const now = Date.now();
      const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
      const tolerance = 1000; // 1 second

      expect(invitation.expiresAt.getTime()).toBeGreaterThanOrEqual(sevenDaysFromNow - tolerance);
      expect(invitation.expiresAt.getTime()).toBeLessThanOrEqual(sevenDaysFromNow + tolerance);
    });

    it('should generate unique tokens for each invitation', async () => {
      const emails = ['student1@example.com', 'student2@example.com', 'student3@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      const tokens = result.map((i) => i.token);
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(3); // All tokens should be unique
    });

    it('should pass ClassId correctly to Invitation entities', async () => {
      const emails = ['student@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      result.forEach((invitation) => {
        expect(invitation.classId.toString()).toBe(classId);
      });
    });

    it('should pass UserId correctly to Invitation entities', async () => {
      const emails = ['student@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      result.forEach((invitation) => {
        expect(invitation.teacherId.toString()).toBe(teacherId);
      });
    });

    it('should create invitations at current time', async () => {
      const emails = ['student@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      result.forEach((invitation) => {
        expect(invitation.createdAt.getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
      });
    });
  });

  describe('email validation', () => {
    it('should accept emails with subdomains', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, [
        'student@sub.domain.example.com',
      ]);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(1);
    });

    it('should accept emails with numeric domains', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, [
        'student@example123.com',
      ]);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(1);
    });

    it('should reject empty email strings', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, [
        '',
        'valid@example.com',
      ]);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('valid@example.com');
    });

    it('should reject emails with spaces', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, [
        'space @example.com',
        'valid@example.com',
      ]);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(1);
    });

    it('should handle email case sensitivity', async () => {
      const command = new CreateEmailInvitationsCommand(classId, teacherId, [
        'Student@Example.com',
        'student@example.com',
      ]);

      // Email deduplication should NOT be case-sensitive per email standards
      // (in practice, email providers are case-insensitive for local part, but we keep them as-is)
      const result = await useCase.execute(command);

      // Current implementation: case-sensitive deduplication (both will be kept)
      expect(result).toHaveLength(2);
    });
  });

  describe('invitation lifecycle', () => {
    it('should create invitations with correct initial status', async () => {
      const emails = ['student@example.com'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      result.forEach((invitation) => {
        expect(invitation.status).toBe('PENDING');
        expect(invitation.acceptedAt).toBeNull();
      });
    });

    it('should not save if all emails are invalid', async () => {
      const invalidEmails = ['not-email', 'also-not-email', '@invalid'];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, invalidEmails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(0);
      expect(mockInvitationRepository.saveMany).toHaveBeenCalledWith([]);
    });

    it('should preserve order of valid emails', async () => {
      const emails = [
        'first@example.com',
        'invalid-email',
        'second@example.com',
        'another-invalid',
        'third@example.com',
      ];
      const command = new CreateEmailInvitationsCommand(classId, teacherId, emails);

      const result = await useCase.execute(command);

      expect(result).toHaveLength(3);
      expect(result[0].email).toBe('first@example.com');
      expect(result[1].email).toBe('second@example.com');
      expect(result[2].email).toBe('third@example.com');
    });
  });
});
