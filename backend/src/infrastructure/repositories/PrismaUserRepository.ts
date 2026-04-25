import type { PrismaClient } from '@prisma/client';

import type { UserRole, AuthProvider } from '@domain/entities/User.js';
import { User } from '@domain/entities/User.js';
import type { IUserRepository, CreateUserDTO } from '@domain/repositories/IUserRepository.js';
import { Email } from '@domain/value-objects/Email.js';
import { UserId } from '@domain/value-objects/UserId.js';

/**
 * PrismaUserRepository
 * Infrastructure implementation of IUserRepository using Prisma ORM
 */
export class PrismaUserRepository implements IUserRepository {
  private constructor(private prisma: PrismaClient) {}

  static create(prismaClient: PrismaClient): PrismaUserRepository {
    return new PrismaUserRepository(prismaClient);
  }

  async findById(id: UserId): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.value },
    });

    if (!user) return null;

    return this.toDomain(user);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!user) return null;

    return this.toDomain(user);
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.value,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        provider: data.provider,
        providerId: data.providerId || null,
      },
    });

    return this.toDomain(user);
  }

  async update(user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: user.id.value },
      data: {
        email: user.email.value,
        password: user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        provider: user.provider,
        providerId: user.providerId,
        refreshTokenVersion: user.refreshTokenVersion,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.value },
    });
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.value },
    });

    return count > 0;
  }

  /**
   * Convert Prisma model to Domain Entity
   */
  private toDomain(prismaUser: any): User {
    return User.create({
      id: UserId.create(prismaUser.id),
      email: Email.create(prismaUser.email),
      passwordHash: prismaUser.password,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role as UserRole,
      provider: prismaUser.provider as AuthProvider,
      providerId: prismaUser.providerId,
      refreshTokenVersion: prismaUser.refreshTokenVersion ?? 0,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}
