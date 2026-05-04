import type { ExamAssignment } from '@domain/entities/ExamAssignment.js';
import { ConflictError, NotFoundError, ValidationError } from '@domain/errors/DomainError.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface AssignExamToStudentInput {
  examId: string;
  studentId: string;
  teacherId: string;
  dueDate?: Date;
}

export class AssignExamToStudentUseCase {
  constructor(
    private readonly assignmentRepo: IExamAssignmentRepository,
    private readonly examRepo: IExamRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: AssignExamToStudentInput): Promise<ExamAssignment> {
    // Validate exam exists and belongs to teacher
    const exam = await this.examRepo.findById(input.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    assertOwnership(exam.userId, input.teacherId, 'You can only assign your own exams');

    // Validate student exists and has STUDENT role
    const student = await this.userRepo.findById(UserId.create(input.studentId));
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (!student.isStudent()) {
      throw new ValidationError('User is not a student');
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentRepo.findByExamAndStudent(
      input.examId,
      UserId.create(input.studentId)
    );

    if (existingAssignment) {
      throw new ConflictError('Exam already assigned to this student');
    }

    // Create assignment
    const assignment = await this.assignmentRepo.create({
      examId: input.examId,
      studentId: UserId.create(input.studentId),
      teacherId: UserId.create(input.teacherId),
      dueDate: input.dueDate,
    });

    return assignment;
  }
}
