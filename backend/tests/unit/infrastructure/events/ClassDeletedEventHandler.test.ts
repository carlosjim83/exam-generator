import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import type { IClassDocumentRepository } from '@domain/repositories/IClassDocumentRepository.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { ClassDeletedEvent } from '@domain/events/DocumentEvents.js';
import { ClassDeletedEventHandler } from '@infrastructure/events/handlers/ClassDeletedEventHandler.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

describe('ClassDeletedEventHandler', () => {
  let handler: ClassDeletedEventHandler;
  let mockClassDocumentRepository: IClassDocumentRepository;
  let mockStudentEnrollmentRepository: IStudentEnrollmentRepository;
  let mockInvitationRepository: IInvitationRepository;

  beforeEach(() => {
    // Create mocks
    mockClassDocumentRepository = {
      deleteByClassId: vi.fn().mockResolvedValue(undefined),
      // Add other required methods
    } as unknown as IClassDocumentRepository;

    mockStudentEnrollmentRepository = {
      deleteByClassId: vi.fn().mockResolvedValue(undefined),
      // Add other required methods
    } as unknown as IStudentEnrollmentRepository;

    mockInvitationRepository = {
      deleteByClassId: vi.fn().mockResolvedValue(undefined),
      // Add other required methods
    } as unknown as IInvitationRepository;

    handler = new ClassDeletedEventHandler(
      mockClassDocumentRepository,
      mockStudentEnrollmentRepository,
      mockInvitationRepository
    );
  });

  it('should delete enrollments, invitations, and class-document relationships', async () => {
    const classId = uuidv4();
    const teacherId = uuidv4();
    const event: ClassDeletedEvent = {
      eventName: 'class.deleted',
      aggregateId: classId,
      occurredAt: new Date(),
      payload: {
        classId,
        teacherId,
        className: 'Test Class',
      },
    };

    await handler.handle(event);

    // Verify enrollments were deleted
    expect(mockStudentEnrollmentRepository.deleteByClassId).toHaveBeenCalledWith(
      ClassId.create(classId)
    );

    // Verify invitations were deleted
    expect(mockInvitationRepository.deleteByClassId).toHaveBeenCalledWith(ClassId.create(classId));

    // Verify class-document relationships were deleted
    expect(mockClassDocumentRepository.deleteByClassId).toHaveBeenCalledWith(
      ClassId.create(classId)
    );
  });

  it('should log error and rethrow if cleanup fails', async () => {
    const classId = uuidv4();
    const teacherId = uuidv4();
    const event: ClassDeletedEvent = {
      eventName: 'class.deleted',
      aggregateId: classId,
      occurredAt: new Date(),
      payload: {
        classId,
        teacherId,
        className: 'Test Class',
      },
    };

    // Make deleteByClassId throw
    (
      mockStudentEnrollmentRepository.deleteByClassId as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handler.handle(event)).rejects.toThrow('Database error');

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log success message after cleanup', async () => {
    const classId = uuidv4();
    const teacherId = uuidv4();
    const event: ClassDeletedEvent = {
      eventName: 'class.deleted',
      aggregateId: classId,
      occurredAt: new Date(),
      payload: {
        classId,
        teacherId,
        className: 'Test Class',
      },
    };

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handler.handle(event);

    expect(consoleSpy).toHaveBeenCalledWith(`✅ Class cleanup completed: ${classId}`);

    consoleSpy.mockRestore();
  });
});
