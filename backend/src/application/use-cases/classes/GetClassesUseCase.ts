import type { Class } from '@domain/entities/Class.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetClassesOutput {
  classes: Class[];
  total: number;
}

export class GetClassesCommand {
  constructor(
    public teacherId: string,
    public page = 1,
    public limit = 20,
    public search = ''
  ) {}
}

export class GetClassesUseCase {
  constructor(private readonly classRepository: IClassRepository) {}

  async execute(command: GetClassesCommand): Promise<GetClassesOutput> {
    const teacherId = UserId.create(command.teacherId);

    const result = await this.classRepository.findByTeacherId(teacherId, {
      page: command.page,
      limit: command.limit,
      search: command.search,
    });

    return {
      classes: result.classes,
      total: result.total,
    };
  }
}
