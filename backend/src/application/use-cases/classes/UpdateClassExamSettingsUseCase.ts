import { NotFoundError, ForbiddenError, ConflictError } from '@domain/errors/DomainError.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface UpdateClassExamSettingsInput {
  classExamId: string;
  classId: string;
  teacherId: string;
  availableAt?: Date | null;
  dueDate?: Date | null;
  timeLimit?: number | null;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
}

export interface UpdateClassExamSettingsOutput {
  id: string;
  classId: string;
  examId: string;
  availableAt: Date | null;
  dueDate: Date | null;
  timeLimit: number | null;
  maxAttempts: number;
  showResultsImmediately: boolean;
  isPublished: boolean;
}

/**
 * UpdateClassExamSettingsUseCase
 *
 * Updates the settings of a class exam (availability, due date, time limit, etc).
 */
export class UpdateClassExamSettingsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(input: UpdateClassExamSettingsInput): Promise<UpdateClassExamSettingsOutput> {
    const classExamId = ClassExamId.create(input.classExamId);
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);

    // Verify class exists and teacher owns it
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    if (!classEntity.teacherId.equals(teacherId)) {
      throw new ForbiddenError('You are not the teacher of this class');
    }

    // Get the class exam
    const classExam = await this.classExamRepository.findById(classExamId);
    if (!classExam) {
      throw new NotFoundError('Class exam not found');
    }

    // Verify class exam belongs to this class
    if (!classExam.classId.equals(classId)) {
      throw new ConflictError('Class exam does not belong to this class');
    }

    // Build update object
    const updates: Partial<{
      availableAt: Date | null;
      dueDate: Date | null;
      timeLimit: number | null;
      maxAttempts: number;
      showResultsImmediately: boolean;
    }> = {};

    if (input.availableAt !== undefined) updates.availableAt = input.availableAt;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
    if (input.timeLimit !== undefined) updates.timeLimit = input.timeLimit;
    if (input.maxAttempts !== undefined) updates.maxAttempts = input.maxAttempts;
    if (input.showResultsImmediately !== undefined)
      updates.showResultsImmediately = input.showResultsImmediately;

    // Update settings
    const updatedClassExam = classExam.updateSettings(updates);

    await this.classExamRepository.save(updatedClassExam);

    return {
      id: updatedClassExam.id.toString(),
      classId: updatedClassExam.classId.toString(),
      examId: updatedClassExam.examId,
      availableAt: updatedClassExam.availableAt,
      dueDate: updatedClassExam.dueDate,
      timeLimit: updatedClassExam.timeLimit,
      maxAttempts: updatedClassExam.maxAttempts,
      showResultsImmediately: updatedClassExam.showResultsImmediately,
      isPublished: updatedClassExam.isPublished,
    };
  }
}
