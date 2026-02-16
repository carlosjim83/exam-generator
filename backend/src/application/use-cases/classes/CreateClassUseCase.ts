import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { Class } from '@domain/entities/Class.js';

export class CreateClassCommand {
  constructor(
    public teacherId: string,
    public name: string,
    public description?: string,
    public color?: string
  ) {}
}

export class CreateClassUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(command: CreateClassCommand): Promise<Class> {
    // Generate unique class code
    let code: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      code = this.generateClassCode();
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique class code');
      }
    } while (await this.classRepository.existsByCode(code));

    const classEntity = new Class(
      new ClassId(),
      UserId.create(command.teacherId),
      command.name,
      code,
      command.description || null,
      command.color || null
    );

    await this.classRepository.save(classEntity);

    return classEntity;
  }

  private generateClassCode(): string {
    // Use uppercase letters and digits, excluding confusing chars (O, 0, I, 1)
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * validChars.length);
      code += validChars[randomIndex];
    }

    return code;
  }
}
