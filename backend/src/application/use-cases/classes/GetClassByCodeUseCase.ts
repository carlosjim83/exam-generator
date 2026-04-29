import type { Class } from '@domain/entities/Class.js';
import { NotFoundError } from '@domain/errors/DomainError.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';

export class GetClassByCodeCommand {
  constructor(public code: string) {}
}

export class GetClassByCodeUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly userRepository: IUserRepository
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
      throw new NotFoundError('Teacher not found');
    }

    return {
      class: classEntity,
      teacherName: teacher.firstName + ' ' + teacher.lastName,
    };
  }
}
