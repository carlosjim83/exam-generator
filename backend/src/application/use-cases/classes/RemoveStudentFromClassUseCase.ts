import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class RemoveStudentFromClassCommand {
  constructor(
    public classId: string,
    public studentId: string,
    public teacherId: string
  ) {}
}

export class RemoveStudentFromClassUseCase {
  constructor(
    private readonly studentEnrollmentRepository: IStudentEnrollmentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(command: RemoveStudentFromClassCommand): Promise<void> {
    const classId = new ClassId(command.classId);
    const studentId = UserId.create(command.studentId);
    const teacherId = command.teacherId;

    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(
      classEntity.teacherId,
      teacherId,
      'You do not have permission to remove students from this class'
    );

    const enrollment = await this.studentEnrollmentRepository.findByClassAndStudent(
      classId,
      studentId
    );
    if (!enrollment) {
      throw new ConflictError('Student not enrolled in this class');
    }

    await this.studentEnrollmentRepository.delete(enrollment.id);
  }
}
