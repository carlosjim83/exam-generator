import { NotFoundError, ForbiddenError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class GetClassInvitationsCommand {
  constructor(
    public classId: string,
    public userId: string
  ) {}
}

export class GetClassInvitationsUseCase {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(command: GetClassInvitationsCommand): Promise<{
    invitations: {
      id: string;
      email: string;
      status: string;
      expiresAt: Date;
      acceptedAt: Date | null;
    }[];
  }> {
    const classId = new ClassId(command.classId);
    const userId = UserId.create(command.userId);

    // Validate class exists and belongs to teacher
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    if (classEntity.teacherId.toString() !== userId.toString()) {
      throw new ForbiddenError('You do not have permission for this class');
    }

    const result = await this.invitationRepository.findByClassId(classId, {
      page: 1,
      limit: 1000, // Get all invitations
    });

    return {
      invitations: result.invitations.map((i) => ({
        id: i.id.toString(),
        email: i.email,
        status: i.status,
        expiresAt: i.expiresAt,
        acceptedAt: i.acceptedAt,
      })),
    };
  }
}
