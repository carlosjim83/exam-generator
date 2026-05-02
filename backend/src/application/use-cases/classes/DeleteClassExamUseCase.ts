import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface DeleteClassExamInput {
  classExamId: string;
  classId: string;
  teacherId: string;
}

/**
 * DeleteClassExamUseCase
 *
 * Removes an exam from a class. Does NOT delete the exam itself.
 * ExamAssignments are kept for historical purposes (soft delete approach).
 */
export class DeleteClassExamUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: DeleteClassExamInput): Promise<void> {
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

    // Delete the class exam
    await this.classExamRepository.delete(classExamId);
  }
}
