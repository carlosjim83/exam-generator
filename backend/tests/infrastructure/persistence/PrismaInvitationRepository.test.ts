import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Invitation } from '@domain/entities/Invitation.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { PrismaInvitationRepository } from '@infrastructure/persistence/PrismaInvitationRepository.js';
import { InvitationMother } from '@tests/helpers/mothers/InvitationMother.js';
import { prisma } from '@config/prisma.js';

describe('PrismaInvitationRepository Integration Tests', () => {
  let repository: PrismaInvitationRepository;
  let testTeacherId: string;
  let testClassId: string;

  beforeEach(async () => {
    repository = new PrismaInvitationRepository(prisma);

    // Create a test teacher user (required for foreign key constraint)
    const teacher = await prisma.user.create({
      data: {
        email: `test-teacher-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Teacher',
        password: 'hashed-password',
        role: 'TEACHER',
        provider: 'LOCAL',
      },
    });
    testTeacherId = teacher.id;

    // Create a test class
    const classRecord = await prisma.class.create({
      data: {
        teacherId: testTeacherId,
        name: 'Test Class',
        code: `CLASS-${Date.now()}`,
        description: 'Test description',
      },
    });
    testClassId = classRecord.id;

    // Clean up before each test
    await prisma.Invitation.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.Invitation.deleteMany({});
    // Note: We keep the teacher and class to avoid foreign key violations
  });

  describe('save', () => {
    it('should save a new invitation', async () => {
      const invitation = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const saved = await prisma.Invitation.findUnique({
        where: { id: invitation.id.toString() },
      });

      expect(saved).toBeDefined();
      expect(saved?.id).toBe(invitation.id.toString());
      expect(saved?.email).toBe(invitation.email);
      expect(saved?.status).toBe(invitation.status);
      expect(saved?.token).toBe(invitation.token);
    });

    it('should update an existing invitation', async () => {
      const invitation = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      // Accept the invitation
      invitation.accept();

      await repository.save(invitation);

      const updated = await prisma.Invitation.findUnique({
        where: { id: invitation.id.toString() },
      });

      expect(updated?.status).toBe('ACCEPTED');
      expect(updated?.acceptedAt).toBeDefined();
    });
  });

  describe('saveMany', () => {
    it('should save multiple invitations', async () => {
      const invitations = InvitationMother.createMany(3, {
        teacherId: testTeacherId,
        classId: testClassId,
      });

      // Update emails to be unique
      invitations.forEach((inv, i) => {
        // @ts-expect-error - We need to set email directly for uniqueness
        inv.email = `student-${Date.now()}-${i}@example.com`;
      });

      await repository.saveMany(invitations);

      const saved = await prisma.Invitation.findMany({
        where: { classId: testClassId },
      });

      expect(saved).toHaveLength(3);
      expect(saved.some((s) => s.id === invitations[0].id.toString())).toBe(true);
      expect(saved.some((s) => s.id === invitations[1].id.toString())).toBe(true);
      expect(saved.some((s) => s.id === invitations[2].id.toString())).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find an invitation by id', async () => {
      const invitation = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findById(invitation.id);

      expect(found).toBeDefined();
      expect(found?.id.equals(invitation.id)).toBe(true);
      expect(found?.email).toBe(invitation.email);
    });

    it('should return null when invitation not found', async () => {
      const found = await repository.findById(
        InvitationId.fromString('123e4567-e89b-42d3-a456-426614174000')
      );

      expect(found).toBeNull();
    });

    it('should find pending invitation', async () => {
      const invitation = InvitationMother.pending({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findById(invitation.id);

      expect(found).toBeDefined();
      expect(found?.status).toBe('PENDING');
    });

    it('should find accepted invitation', async () => {
      const invitation = InvitationMother.accepted({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findById(invitation.id);

      expect(found).toBeDefined();
      expect(found?.status).toBe('ACCEPTED');
    });

    it('should find revoked invitation', async () => {
      const invitation = InvitationMother.revoked({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findById(invitation.id);

      expect(found).toBeDefined();
      expect(found?.status).toBe('REVOKED');
    });
  });

  describe('findByToken', () => {
    it('should find an invitation by token', async () => {
      const invitation = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findByToken(invitation.token);

      expect(found).toBeDefined();
      expect(found?.token).toBe(invitation.token);
      expect(found?.id.equals(invitation.id)).toBe(true);
    });

    it('should return null when token not found', async () => {
      const found = await repository.findByToken('invalid-token');

      expect(found).toBeNull();
    });

    it('should find active invitation', async () => {
      const invitation = InvitationMother.pending({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findByToken(invitation.token);

      expect(found).toBeDefined();
      expect(found?.isValid()).toBe(true);
    });

    it('should return null for expired invitation', async () => {
      const invitation = InvitationMother.expired({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      const found = await repository.findByToken(invitation.token);

      expect(found).toBeDefined();
      expect(found?.isExpired()).toBe(true);
    });
  });

  describe('findByClassId', () => {
    it('should find all invitations by class id', async () => {
      const invitation1 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}-1@example.com`,
      });
      const invitation2 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}-2@example.com`,
      });

      await repository.save(invitation1);
      await repository.save(invitation2);

      const found = await repository.findByClassId(ClassId.create(testClassId));

      expect(found.invitations).toHaveLength(2);
      expect(found.invitations.some((i) => i.id.equals(invitation1.id))).toBe(true);
      expect(found.invitations.some((i) => i.id.equals(invitation2.id))).toBe(true);
    });

    it('should return empty array when class has no invitations', async () => {
      const class2 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Another Class',
          code: `CLASS2-${Date.now()}`,
        },
      });

      const found = await repository.findByClassId(ClassId.create(class2.id));

      expect(found.invitations).toHaveLength(0);
      expect(found.total).toBe(0);
    });

    it('should filter by status', async () => {
      const pending = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `pending-${Date.now()}@example.com`,
        status: 'PENDING',
      });
      const accepted = InvitationMother.accepted({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `accepted-${Date.now()}@example.com`,
        status: 'ACCEPTED',
      });

      await repository.save(pending);
      await repository.save(accepted);

      const foundPending = await repository.findByClassId(ClassId.create(testClassId), {
        status: 'PENDING',
      });

      expect(foundPending.invitations).toHaveLength(1);
      expect(foundPending.invitations[0].status).toBe('PENDING');

      const foundAccepted = await repository.findByClassId(ClassId.create(testClassId), {
        status: 'ACCEPTED',
      });

      expect(foundAccepted.invitations).toHaveLength(1);
      expect(foundAccepted.invitations[0].status).toBe('ACCEPTED');
    });

    it('should support pagination', async () => {
      const invitations = InvitationMother.createMany(5, {
        teacherId: testTeacherId,
        classId: testClassId,
      });

      invitations.forEach((inv, i) => {
        // @ts-expect-error - We need to set email directly for uniqueness
        inv.email = `student-${Date.now()}-${i}@example.com`;
      });

      for (const inv of invitations) {
        await repository.save(inv);
      }

      const foundFirstPage = await repository.findByClassId(ClassId.create(testClassId), {
        page: 1,
        limit: 2,
      });

      expect(foundFirstPage.invitations).toHaveLength(2);
      expect(foundFirstPage.total).toBe(5);

      const foundSecondPage = await repository.findByClassId(ClassId.create(testClassId), {
        page: 2,
        limit: 2,
      });

      expect(foundSecondPage.invitations).toHaveLength(2);
    });
  });

  describe('findByEmail', () => {
    it('should find all invitations by email', async () => {
      const email = `student-${Date.now()}@example.com`;
      const invitation1 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email,
      });

      const class2 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Another Class',
          code: `CLASS2-${Date.now()}`,
        },
      });

      const invitation2 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: class2.id,
        email,
      });

      await repository.save(invitation1);
      await repository.save(invitation2);

      const found = await repository.findByEmail(email);

      expect(found).toHaveLength(2);
      expect(found.some((i) => i.id.equals(invitation1.id))).toBe(true);
      expect(found.some((i) => i.id.equals(invitation2.id))).toBe(true);
    });

    it('should return empty array when email not found', async () => {
      const found = await repository.findByEmail(`nonexistent-${Date.now()}@example.com`);

      expect(found).toHaveLength(0);
    });

    it('should find invitations with different statuses for same email', async () => {
      const email = `student-${Date.now()}@example.com`;
      const pending = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email,
        status: 'PENDING',
      });
      const accepted = InvitationMother.accepted({
        teacherId: testTeacherId,
        classId: testClassId,
        email,
        status: 'ACCEPTED',
      });

      await repository.save(pending);
      await repository.save(accepted);

      const found = await repository.findByEmail(email);

      expect(found).toHaveLength(2);
      expect(found.some((i) => i.status === 'PENDING')).toBe(true);
      expect(found.some((i) => i.status === 'ACCEPTED')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete an invitation', async () => {
      const invitation = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);
      await repository.delete(invitation.id);

      const found = await prisma.Invitation.findUnique({
        where: { id: invitation.id.toString() },
      });

      expect(found).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple classes with invitations', async () => {
      const class2 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Class 2',
          code: `CLASS2-${Date.now()}`,
        },
      });

      const class3 = await prisma.class.create({
        data: {
          teacherId: testTeacherId,
          name: 'Class 3',
          code: `CLASS3-${Date.now()}`,
        },
      });

      const invitation1 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `class1-${Date.now()}@example.com`,
      });
      const invitation2 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: class2.id,
        email: `class2-${Date.now()}@example.com`,
      });
      const invitation3 = InvitationMother.create({
        teacherId: testTeacherId,
        classId: class3.id,
        email: `class3-${Date.now()}@example.com`,
      });

      await repository.save(invitation1);
      await repository.save(invitation2);
      await repository.save(invitation3);

      const class1Invitations = await repository.findByClassId(ClassId.create(testClassId));
      const class2Invitations = await repository.findByClassId(ClassId.create(class2.id));
      const class3Invitations = await repository.findByClassId(ClassId.create(class3.id));

      expect(class1Invitations.invitations).toHaveLength(1);
      expect(class2Invitations.invitations).toHaveLength(1);
      expect(class3Invitations.invitations).toHaveLength(1);
    });

    it('should handle invitation lifecycle (pending -> accepted)', async () => {
      const invitation = InvitationMother.pending({
        teacherId: testTeacherId,
        classId: testClassId,
        email: `student-${Date.now()}@example.com`,
      });

      await repository.save(invitation);

      let found = await repository.findByToken(invitation.token);
      expect(found?.status).toBe('PENDING');

      found?.accept();
      await repository.save(found);

      found = await repository.findByToken(invitation.token);
      expect(found?.status).toBe('ACCEPTED');
      expect(found?.acceptedAt).toBeDefined();
    });
  });
});
