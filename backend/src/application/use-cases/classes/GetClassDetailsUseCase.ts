import type { Class } from '@domain/entities/Class.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export class GetClassDetailsCommand {
  constructor(
    public classId: string,
    public userId: string
  ) {}
}

export class GetClassDetailsUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: GetClassDetailsCommand): Promise<{
    class: Class;
    teacherName: string;
    studentCount: number;
  }> {
    const classId = new ClassId(command.classId);

    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    const teacher = await this.userRepository.findById(classEntity.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const studentCount = await this.classRepository.countStudents(classId);

    return {
      class: classEntity,
      teacherName: teacher.fullName,
      studentCount,
    };
  }
}
