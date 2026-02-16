import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { Class } from '@domain/entities/Class.js';

export class GetClassByCodeCommand {
  constructor(public code: string) {}
}

export class GetClassByCodeUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(command: GetClassByCodeCommand): Promise<{ class: Class } | null> {
    const classEntity = await this.classRepository.findByCode(command.code);

    if (!classEntity) {
      return null;
    }

    return { class: classEntity };
  }
}
