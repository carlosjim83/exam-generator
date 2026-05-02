import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Class } from '@domain/entities/Class.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { PrismaClassRepository } from '@infrastructure/persistence/PrismaClassRepository.js';
import { ClassMother } from '@tests/helpers/factories/ClassMother.js';
import { prisma } from '@config/prisma.js';

describe('PrismaClassRepository Integration Tests', () => {
  let repository: PrismaClassRepository;
  let testTeacherId: string;

  beforeEach(async () => {
    repository = new PrismaClassRepository(prisma);

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

    // Clean up before each test
    await prisma.studentEnrollment.deleteMany({});
    await prisma.Invitation.deleteMany({});
    await prisma.Class.deleteMany({});
    // Note: We keep the teacher user to avoid foreign key violations
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.studentEnrollment.deleteMany({});
    await prisma.Invitation.deleteMany({});
    await prisma.Class.deleteMany({});
    // Note: We keep the teacher user to avoid foreign key violations
  });

  describe('save', () => {
    it('should save a new class', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      const saved = await prisma.Class.findUnique({
        where: { id: classEntity.id.toString() },
      });

      expect(saved).toBeDefined();
      expect(saved?.id).toBe(classEntity.id.toString());
      expect(saved?.name).toBe(classEntity.name);
      expect(saved?.code).toBe(classEntity.code);
    });

    it('should update an existing class', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      // Create a new class entity with updated values
      const updatedClass = new Class(
        classEntity.id,
        classEntity.teacherId,
        'Updated Class Name',
        classEntity.code,
        'Updated description',
        classEntity.color
      );

      await repository.save(updatedClass);

      const updated = await prisma.Class.findUnique({
        where: { id: classEntity.id.toString() },
      });

      expect(updated?.name).toBe('Updated Class Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.updatedAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find a class by id', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      const found = await repository.findById(classEntity.id);

      expect(found).toBeDefined();
      expect(found?.id.equals(classEntity.id)).toBe(true);
      expect(found?.name).toBe(classEntity.name);
      expect(found?.code).toBe(classEntity.code);
    });

    it('should return null when class not found', async () => {
      const found = await repository.findById(
        ClassId.fromString('123e4567-e89b-42d3-a456-426614174000')
      );

      expect(found).toBeNull();
    });
  });

  describe('findByTeacherId', () => {
    it('should find all classes by teacher id', async () => {
      const class1 = ClassMother.create({
        teacherId: testTeacherId,
        code: `C1-${Date.now().toString().substring(0, 4)}`,
      });
      const class2 = ClassMother.create({
        teacherId: testTeacherId,
        code: `C2-${Date.now().toString().substring(0, 4)}`,
      });

      await repository.save(class1);
      await repository.save(class2);

      const found = await repository.findByTeacherId(UserId.create(testTeacherId));

      expect(found.classes).toHaveLength(2);
      expect(found.classes.some((c) => c.id.equals(class1.id))).toBe(true);
      expect(found.classes.some((c) => c.id.equals(class2.id))).toBe(true);
    });

    it('should return empty array when teacher has no classes', async () => {
      const found = await repository.findByTeacherId(UserId.create(testTeacherId));

      expect(found.classes).toHaveLength(0);
    });
  });

  describe('findByCode', () => {
    it('should find a class by code', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      const found = await repository.findByCode(classEntity.code);

      expect(found).toBeDefined();
      expect(found?.code).toBe(classEntity.code);
      expect(found?.id.equals(classEntity.id)).toBe(true);
    });

    it('should return null when code not found', async () => {
      const found = await repository.findByCode('INVALID');

      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a class', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);
      await repository.delete(classEntity.id);

      const found = await prisma.Class.findUnique({
        where: { id: classEntity.id.toString() },
      });

      expect(found).toBeNull();
    });
  });

  describe('existsByCode', () => {
    it('should return true when code exists', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      const exists = await repository.existsByCode(classEntity.code);

      expect(exists).toBe(true);
    });

    it('should return false when code does not exist', async () => {
      const exists = await repository.existsByCode('INVALID');

      expect(exists).toBe(false);
    });

    it('should return false when checking own code', async () => {
      const classEntity = ClassMother.create({
        teacherId: testTeacherId,
      });

      await repository.save(classEntity);

      const exists = await repository.existsByCode(classEntity.code, classEntity.id);

      expect(exists).toBe(false);
    });
  });

  describe('countByTeacherId', () => {
    it('should count classes by teacher id', async () => {
      const class1 = ClassMother.create({
        teacherId: testTeacherId,
        code: `CC1-${Date.now().toString().substring(0, 4)}`,
      });
      const class2 = ClassMother.create({
        teacherId: testTeacherId,
        code: `CC2-${Date.now().toString().substring(0, 4)}`,
      });

      await repository.save(class1);
      await repository.save(class2);

      const count = await repository.countByTeacherId(UserId.create(testTeacherId));

      expect(count).toBe(2);
    });

    it('should return 0 for teacher with no classes', async () => {
      const count = await repository.countByTeacherId(UserId.create(testTeacherId));

      expect(count).toBe(0);
    });
  });
});
