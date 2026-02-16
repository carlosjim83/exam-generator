import { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import type { InvitationStatus } from '@domain/entities/Invitation.js';
import { Invitation } from '@domain/entities/Invitation.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { PrismaClient } from '@prisma/client';

type InvitationRecord = {
  id: string;
  classId: string;
  teacherId: string;
  email: string;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export class PrismaInvitationRepository implements IInvitationRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaInvitationRepository {
    return new PrismaInvitationRepository(prismaClient);
  }

  async findById(id: InvitationId): Promise<Invitation | null> {
    const invitationRecord = await this.prisma.invitation.findUnique({
      where: { id: id.toString() },
    });

    if (!invitationRecord) return null;

    return this.toDomain(invitationRecord);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const invitationRecord = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitationRecord) return null;

    return this.toDomain(invitationRecord);
  }

  async findByClassId(
    classId: ClassId,
    options?: { status?: Invitation['status']; page?: number; limit?: number }
  ): Promise<{ invitations: Invitation[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      classId: classId.toString(),
    };

    if (options?.status) {
      (where as any).status = options.status;
    }

    const total = await this.prisma.invitation.count({ where });

    const invitationRecords = await this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      invitations: invitationRecords.map((record: InvitationRecord) => this.toDomain(record)),
      total,
    };
  }

  async findByEmail(email: string): Promise<Invitation[]> {
    const invitationRecords = await this.prisma.invitation.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    return invitationRecords.map((record: InvitationRecord) => this.toDomain(record));
  }

  async save(invitation: Invitation): Promise<void> {
    const data = {
      id: invitation.id.toString(),
      classId: invitation.classId.toString(),
      teacherId: invitation.teacherId.toString(),
      email: invitation.email,
      status: invitation.status,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    };

    await this.prisma.invitation.upsert({
      where: { id: invitation.id.toString() },
      update: {
        status: invitation.status,
        acceptedAt: invitation.acceptedAt,
      },
      create: data,
    });
  }

  async saveMany(invitations: Invitation[]): Promise<void> {
    const data = invitations.map((invitation) => ({
      id: invitation.id.toString(),
      classId: invitation.classId.toString(),
      teacherId: invitation.teacherId.toString(),
      email: invitation.email,
      status: invitation.status,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    }));

    await this.prisma.invitation.createMany({
      data,
      skipDuplicates: false,
    });
  }

  async delete(id: InvitationId): Promise<void> {
    await this.prisma.invitation.delete({
      where: { id: id.toString() },
    });
  }

  private toDomain(record: InvitationRecord): Invitation {
    return new Invitation(
      new InvitationId(record.id),
      ClassId.create(record.classId),
      UserId.create(record.teacherId),
      record.email,
      record.token,
      record.expiresAt,
      record.status,
      record.acceptedAt,
      record.createdAt
    );
  }
}
