import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { Class } from '@domain/entities/Class.js';

export interface GetClassesOutput {
  classes: Class[];
  total: number;
}

export class GetClassesCommand {
  constructor(
    public teacherId: string,
    public page: number = 1,
    public limit: number = 20,
    public search: string = ''
  ) {}
}

export class GetClassesUseCase {
  constructor(private classRepository: IClassRepository) {}

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
