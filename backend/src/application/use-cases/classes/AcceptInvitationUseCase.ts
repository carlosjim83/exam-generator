import { IInvitationRepository } from '@domain/repositories/IInvitationRepository.js';
import { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { EnrollmentId } from '@domain/value-objects/EnrollmentId.js';
import { StudentEnrollment } from '@domain/entities/StudentEnrollment.js';

export class AcceptInvitationCommand {
  constructor(
    public token: string,
    public studentId: string
  ) {}
}

export class AcceptInvitationUseCase {
  constructor(
    private invitationRepository: IInvitationRepository,
    private enrollmentRepository: IStudentEnrollmentRepository
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<StudentEnrollment> {
    const invitation = await this.invitationRepository.findByToken(command.token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.isExpired()) {
      invitation.accept();
      await this.invitationRepository.save(invitation);
      throw new Error('Invitation has expired');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation is no longer valid');
    }

    const classId = new ClassId(invitation.classId.value);
    const studentId = UserId.create(command.studentId);

    const existingEnrollment = await this.enrollmentRepository.findByClassAndStudent(
      classId,
      studentId
    );
    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new Error('Already enrolled in this class');
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
