import { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export class GetClassStudentsCommand {
  constructor(
    public classId: string,
    public page: number = 1,
    public limit: number = 20,
    public search?: string
  ) {}
}

export class GetClassStudentsUseCase {
  constructor(
    private enrollmentRepository: IStudentEnrollmentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: GetClassStudentsCommand): Promise<{
    students: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      joinedAt: Date;
      isActive: boolean;
    }[];
    total: number;
  }> {
    const classId = new ClassId(command.classId);

    const result = await this.enrollmentRepository.findByClassId(classId, {
      page: command.page,
      limit: command.limit,
      search: command.search,
    });

    const studentsWithDetails = await Promise.all(
      result.enrollments.map(async (enrollment) => {
        const user = await this.userRepository.findById(enrollment.studentId);
        if (!user) {
          throw new Error(`User not found for enrollment ${enrollment.id.value}`);
        }

        return {
          id: user.id.value,
          email: user.email.value,
          firstName: user.firstName,
          lastName: user.lastName,
          joinedAt: enrollment.joinedAt,
          isActive: enrollment.isActive,
        };
      })
    );

    return {
      students: studentsWithDetails,
      total: result.total,
    };
  }
}
