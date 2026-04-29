import { NotFoundError } from '@domain/errors/DomainError.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';

export class GetClassStudentsCommand {
  constructor(
    public classId: string,
    public page = 1,
    public limit = 20,
    public search?: string
  ) {}
}

export class GetClassStudentsUseCase {
  constructor(
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly userRepository: IUserRepository
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
          throw new NotFoundError(`User not found for enrollment ${enrollment.id.value}`);
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
