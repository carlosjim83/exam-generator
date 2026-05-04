import { NotFoundError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';

export class ResendInvitationCommand {
  constructor(
    public invitationId: string,
    public userId: string
  ) {}
}

export class ResendInvitationUseCase {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(command: ResendInvitationCommand): Promise<void> {
    const invitationId = new InvitationId(command.invitationId);
    const userId = UserId.create(command.userId);

    // Find invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // Validate class ownership
    const classEntity = await this.classRepository.findById(invitation.classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(classEntity.teacherId, userId, 'You do not have permission for this class');

    // Note: In a real implementation, you would:
    // 1. Send email notification
    // 2. Update the invitation with new expiration
    // 3. Update updatedAt timestamp

    throw new Error('Resend invitation not yet implemented');
  }
}
