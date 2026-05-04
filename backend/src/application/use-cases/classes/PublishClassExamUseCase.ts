import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface PublishClassExamInput {
  classExamId: string;
  classId: string;
  teacherId: string;
  isPublished: boolean;
}

export interface PublishClassExamOutput {
  id: string;
  classId: string;
  examId: string;
  isPublished: boolean;
}

/**
 * PublishClassExamUseCase
 *
 * Publishes or unpublishes a class exam.
 * When publishing, verifies that the exam is available (availableAt is past or null).
 */
export class PublishClassExamUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: PublishClassExamInput): Promise<PublishClassExamOutput> {
    const classExamId = ClassExamId.create(input.classExamId);
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);

    // Verify class exists and teacher owns it
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(classEntity.teacherId, teacherId, 'You are not the teacher of this class');

    // Get the class exam
    const classExam = await this.classExamRepository.findById(classExamId);
    if (!classExam) {
      throw new NotFoundError('Class exam not found');
    }

    // Verify class exam belongs to this class
    if (!classExam.classId.equals(classId)) {
      throw new ConflictError('Class exam does not belong to this class');
    }

    // Publish or unpublish
    const updatedClassExam = input.isPublished ? classExam.publish() : classExam.unpublish();

    await this.classExamRepository.save(updatedClassExam);

    return {
      id: updatedClassExam.id.toString(),
      classId: updatedClassExam.classId.toString(),
      examId: updatedClassExam.examId,
      isPublished: updatedClassExam.isPublished,
    };
  }
}
