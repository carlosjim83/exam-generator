import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';
import { NotFoundError, ConflictError } from '@domain/errors/DomainError.js';
import type { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class StudentJoinClassWithInvitationCommand {
  constructor(
    public token: string,
    public studentId: string
  ) {}
}

export class StudentJoinClassWithInvitationUseCase {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository
  ) {}

  async execute(command: StudentJoinClassWithInvitationCommand): Promise<StudentEnrollment> {
    const invitation = await this.invitationRepository.findByToken(command.token);

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.isExpired()) {
      await this.invitationRepository.save(invitation);
      throw new ConflictError('Invitation has expired');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictError('Invitation is no longer valid');
    }

    const classId = new ClassId(invitation.classId.value);
    const studentId = UserId.create(command.studentId);

    const existingEnrollment = await this.enrollmentRepository.findByClassAndStudent(
      classId,
      studentId
    );
    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new ConflictError('Already enrolled in this class');
      }

      const reactivatedEnrollment = new StudentEnrollment(
        existingEnrollment.id,
        classId,
        studentId,
        existingEnrollment.joinedAt,
        null,
        true
      );

      await this.enrollmentRepository.save(reactivatedEnrollment);

      invitation.accept();
      await this.invitationRepository.save(invitation);

      return reactivatedEnrollment;
    }

    const enrollment = new StudentEnrollment(
      new EnrollmentId(),
      classId,
      studentId,
      new Date(),
      null,
      true
    );

    await this.enrollmentRepository.save(enrollment);

    invitation.accept();
    await this.invitationRepository.save(invitation);

    return enrollment;
  }
}
