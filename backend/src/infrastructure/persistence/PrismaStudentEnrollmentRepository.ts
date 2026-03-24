import type { Prisma, PrismaClient } from '@prisma/client';

import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * PrismaStudentEnrollmentRepository
 * Infrastructure implementation of IStudentEnrollmentRepository using Prisma ORM
 */
export class PrismaStudentEnrollmentRepository implements IStudentEnrollmentRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaStudentEnrollmentRepository {
    return new PrismaStudentEnrollmentRepository(prismaClient);
  }

  async findById(id: EnrollmentId): Promise<StudentEnrollment | null> {
    const enrollmentRecord = await this.prisma.studentEnrollment.findUnique({
      where: { id: id.toString() },
    });

    if (!enrollmentRecord) return null;

    return this.toDomain(enrollmentRecord);
  }

  async findByClassId(
    classId: ClassId,
    options?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }
  ): Promise<{ enrollments: StudentEnrollment[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentEnrollmentWhereInput = {
      classId: classId.toString(),
    };

    if (options?.activeOnly) {
      where.isActive = true;
    }

    // Get total count
    const total = await this.prisma.studentEnrollment.count({ where });

    // Get paginated results
    const enrollmentRecords = await this.prisma.studentEnrollment.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      enrollments: enrollmentRecords.map((record) => this.toDomain(record)),
      total,
    };
  }

  async findByStudentId(
    studentId: UserId,
    options?: { activeOnly?: boolean }
  ): Promise<StudentEnrollment[]> {
    const where: any = {
      studentId: studentId.toString(),
    };

    if (options?.activeOnly) {
      where.isActive = true;
    }

    const enrollmentRecords = await this.prisma.studentEnrollment.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
    });

    return enrollmentRecords.map((record: any) => this.toDomain(record));
  }

  async findByClassAndStudent(
    classId: ClassId,
    studentId: UserId
  ): Promise<StudentEnrollment | null> {
    const enrollmentRecord = await this.prisma.studentEnrollment.findFirst({
      where: {
        classId: classId.toString(),
        studentId: studentId.toString(),
      },
    });

    if (!enrollmentRecord) return null;

    return this.toDomain(enrollmentRecord);
  }

  async save(enrollment: StudentEnrollment): Promise<void> {
    const data = {
      id: enrollment.id.toString(),
      classId: enrollment.classId.toString(),
      studentId: enrollment.studentId.toString(),
      joinedAt: enrollment.joinedAt,
      leftAt: enrollment.leftAt,
      isActive: enrollment.isActive,
    };

    await this.prisma.studentEnrollment.upsert({
      where: { id: enrollment.id.toString() },
      update: data,
      create: data,
    });
  }

  async delete(id: EnrollmentId): Promise<void> {
    await this.prisma.studentEnrollment.delete({
      where: { id: id.toString() },
    });
  }

  async deleteByClassId(classId: ClassId): Promise<void> {
    await this.prisma.studentEnrollment.deleteMany({
      where: { classId: classId.toString() },
    });
  }

  async isStudentEnrolled(classId: ClassId, studentId: UserId): Promise<boolean> {
    const count = await this.prisma.studentEnrollment.count({
      where: {
        classId: classId.toString(),
        studentId: studentId.toString(),
        isActive: true,
      },
    });

    return count > 0;
  }

  async countByClassId(classId: ClassId): Promise<number> {
    return this.prisma.studentEnrollment.count({
      where: {
        classId: classId.toString(),
        isActive: true,
      },
    });
  }

  async countTotalByTeacherId(teacherId: UserId): Promise<number> {
    // Count all active students across all classes of this teacher
    const result = await this.prisma.studentEnrollment.aggregate({
      where: {
        class: {
          teacherId: teacherId.toString(),
        },
        isActive: true,
      },
      _count: true,
    });

    return result._count || 0;
  }

  /**
   * Maps Prisma StudentEnrollment record to domain StudentEnrollment entity
   */
  private toDomain(record: any): StudentEnrollment {
    return new StudentEnrollment(
      new EnrollmentId(record.id),
      ClassId.create(record.classId),
      UserId.create(record.studentId),
      record.joinedAt,
      record.leftAt,
      record.isActive
    );
  }
}
