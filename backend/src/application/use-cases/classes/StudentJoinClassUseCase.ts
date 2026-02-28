import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class StudentJoinClassCommand {
  constructor(
    public classId: string,
    public studentId: string
  ) {}
}

export class StudentJoinClassUseCase {
  constructor(
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly classRepository: IClassRepository
  ) {}

  async execute(command: StudentJoinClassCommand): Promise<StudentEnrollment> {
    const classId = new ClassId(command.classId);
    const studentId = UserId.create(command.studentId);

    // Find the class
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findByClassAndStudent(
      classId,
      studentId
    );
    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new Error('Already enrolled in this class');
      }

      // Re-enroll (reactivate)
      const reactivatedEnrollment = new StudentEnrollment(
        existingEnrollment.id,
        classId,
        studentId,
        existingEnrollment.joinedAt,
        null,
        true
      );

      await this.enrollmentRepository.save(reactivatedEnrollment);
      return reactivatedEnrollment;
    }

    // Create new enrollment
    const enrollment = new StudentEnrollment(
      new EnrollmentId(),
      classId,
      studentId,
      new Date(),
      null,
      true
    );

    await this.enrollmentRepository.save(enrollment);

    return enrollment;
  }
}
