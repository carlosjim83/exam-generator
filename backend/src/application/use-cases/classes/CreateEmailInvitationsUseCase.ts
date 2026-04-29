import { v4 as uuidv4 } from 'uuid';

import { Invitation } from '@domain/entities/Invitation.js';
import { ValidationError } from '@domain/errors/DomainError.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class CreateEmailInvitationsCommand {
  constructor(
    public classId: string,
    public teacherId: string,
    public emails: string[]
  ) {}
}

export class CreateEmailInvitationsUseCase {
  constructor(private readonly invitationRepository: IInvitationRepository) {}

  async execute(command: CreateEmailInvitationsCommand): Promise<Invitation[]> {
    const maxEmails = 50;

    if (command.emails.length > maxEmails) {
      throw new ValidationError(`Cannot invite more than ${maxEmails} students at once`);
    }

    // Deduplicate and validate emails
    const uniqueEmails = [...new Set(command.emails)].filter((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    const invitations: Invitation[] = [];
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const email of uniqueEmails) {
      const invitation = new Invitation(
        new InvitationId(),
        new ClassId(command.classId),
        UserId.create(command.teacherId),
        email,
        uuidv4(),
        expirationDate,
        'PENDING',
        null,
        new Date()
      );

      invitations.push(invitation);
    }

    await this.invitationRepository.saveMany(invitations);

    return invitations;
  }
}
