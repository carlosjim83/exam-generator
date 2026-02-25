import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { Class } from '@domain/entities/Class.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface GetStudentClassesOutput {
  classes: Class[];
}

export class GetStudentClassesCommand {
  constructor(public studentId: string) {}
}

export class GetStudentClassesUseCase {
  constructor(
    private classRepository: IClassRepository,
    private enrollmentRepository: IStudentEnrollmentRepository
  ) {}

  async execute(command: GetStudentClassesCommand): Promise<GetStudentClassesOutput> {
    const studentId = UserId.create(command.studentId);

    // Get all active enrollments for this student
    const enrollments = await this.enrollmentRepository.findByStudentId(studentId, {
      activeOnly: true,
    });

    // Get class details for each enrollment
    const classes: Class[] = [];
    for (const enrollment of enrollments) {
      const classEntity = await this.classRepository.findById(enrollment.classId);
      if (classEntity) {
        classes.push(classEntity);
      }
    }

    return { classes };
  }
}
