import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { Class } from '@domain/entities/Class.js';

export class GetClassByCodeCommand {
  constructor(public code: string) {}
}

export class GetClassByCodeUseCase {
  constructor(
    private classRepository: IClassRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(
    command: GetClassByCodeCommand
  ): Promise<{ class: Class; teacherName: string } | null> {
    const classEntity = await this.classRepository.findByCode(command.code);

    if (!classEntity) {
      return null;
    }

    const teacher = await this.userRepository.findById(classEntity.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return {
      class: classEntity,
      teacherName: teacher.firstName + ' ' + teacher.lastName,
    };
  }
}
