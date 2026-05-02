import * as CSV from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

import { Invitation } from '@domain/entities/Invitation.js';
import { NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { InvitationId } from '@domain/value-objects/InvitationId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class ImportStudentsCSVCommand {
  constructor(
    public classId: string,
    public teacherId: string,
    public csvContent: string
  ) {}
}

export class CSVImportResult {
  constructor(
    public imported: number,
    public failed: number,
    public errors: string[]
  ) {}
}

export class ImportStudentsCSVUseCase {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(command: ImportStudentsCSVCommand): Promise<CSVImportResult> {
    const classId = new ClassId(command.classId);
    const teacherId = UserId.create(command.teacherId);

    // Validate class exists and belongs to teacher
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(classEntity.teacherId, teacherId, 'You do not have permission for this class');

    // Parse CSV
    const records: any[] = [];
    try {
      records.push(
        ...CSV.parse(command.csvContent, {
          columns: true,
          skip_empty_lines: true,
        })
      );
    } catch (error) {
      return new CSVImportResult(0, 0, ['Invalid CSV format']);
    }

    const emails: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (!record.email) {
        errors.push(`Row ${i + 1}: Missing email field`);
        continue;
      }

      const email = record.email.trim().toLowerCase();
      if (!this.isValidEmail(email)) {
        errors.push(`Row ${i + 1}: Invalid email format - ${record.email}`);
        continue;
      }

      emails.push(email);
    }

    // Create invitations
    const result = await this.invitationRepository.findByClassId(classId, {
      status: 'PENDING' as const,
      page: 1,
      limit: 50,
    });

    const existingEmails = new Set(result.invitations.map((i) => i.email.toLowerCase()));

    const newEmails = emails.filter((email) => !existingEmails.has(email.toLowerCase()));

    if (newEmails.length > 50) {
      return new CSVImportResult(0, newEmails.length, [
        'Cannot invite more than 50 students at once',
      ]);
    }

    if (newEmails.length === 0) {
      return new CSVImportResult(0, 0, []);
    }

    // Create Invitation entities
    const invitations = await Promise.all(
      newEmails.map(async (email) => {
        return new Invitation(
          new InvitationId(),
          classId,
          teacherId,
          email,
          uuidv4(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          'PENDING' as const,
          null,
          new Date()
        );
      })
    );

    await this.invitationRepository.saveMany(invitations);

    return new CSVImportResult(newEmails.length, errors.length, errors);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
