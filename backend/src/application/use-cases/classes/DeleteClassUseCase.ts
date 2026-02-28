import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export class DeleteClassCommand {
  constructor(
    public classId: string,
    public teacherId: string
  ) {}
}

export class DeleteClassUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(command: DeleteClassCommand): Promise<void> {
    const classId = new ClassId(command.classId);
    const teacherId = command.teacherId;

    // First verify the class exists and belongs to the teacher
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    if (classEntity.teacherId.toString() !== teacherId) {
      throw new Error('You do not have permission to delete this class');
    }

    // Delete the class
    await this.classRepository.delete(classId);
  }
}
