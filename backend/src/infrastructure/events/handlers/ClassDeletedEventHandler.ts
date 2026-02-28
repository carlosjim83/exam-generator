import type { ClassDeletedEvent } from '@domain/events/DocumentEvents.js';
import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

/**
 * ClassDeletedEventHandler
 *
 * Handles the 'class.deleted' event by cleaning up all related data:
 * - Deletes student enrollments
 * - Deletes pending invitations
 * - Deletes class-document relationships (unshare all documents)
 *
 * This replaces database-level cascade deletes with explicit domain-controlled cleanup,
 * providing better control, auditability, and extensibility.
 */
export class ClassDeletedEventHandler {
  constructor(
    private readonly classDocumentRepository: IClassDocumentRepository,
    private readonly studentEnrollmentRepository: IStudentEnrollmentRepository,
    private readonly invitationRepository: IInvitationRepository
  ) {}

  async handle(event: ClassDeletedEvent): Promise<void> {
    const { classId, className } = event.payload;

    console.log(`🗑️ Handling class.deleted event for class: ${classId} (${className})`);

    try {
      const clsId = ClassId.create(classId);

      // 1. Delete all student enrollments
      console.log(`  👥 Deleting enrollments for class: ${classId}`);
      await this.studentEnrollmentRepository.deleteByClassId(clsId);

      // 2. Delete all invitations
      console.log(`  ✉️ Deleting invitations for class: ${classId}`);
      await this.invitationRepository.deleteByClassId(clsId);

      // 3. Delete all class-document relationships (unshare all documents)
      console.log(`  📚 Deleting class-document relationships for class: ${classId}`);
      await this.classDocumentRepository.deleteByClassId(clsId);

      console.log(`✅ Class cleanup completed: ${classId}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup class ${classId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        className,
      });
      // In production, you'd want to:
      // - Log to monitoring service (Sentry, etc.)
      // - Retry the event
      // - Send to dead letter queue
      throw error;
    }
  }
}

/**
 * Factory function to create the handler with dependencies
 */
export function createClassDeletedEventHandler(
  classDocumentRepository: IClassDocumentRepository,
  studentEnrollmentRepository: IStudentEnrollmentRepository,
  invitationRepository: IInvitationRepository
): ClassDeletedEventHandler {
  return new ClassDeletedEventHandler(
    classDocumentRepository,
    studentEnrollmentRepository,
    invitationRepository
  );
}
