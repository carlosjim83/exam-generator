import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { IExamRepository } from '@domain/repositories/IExamRepository.js';
import { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { ExamAssignment } from '@domain/entities/ExamAssignment.js';

export interface AssignExamToStudentInput {
  examId: string;
  studentId: string;
  teacherId: string;
  dueDate?: Date;
}

export class AssignExamToStudentUseCase {
  constructor(
    private assignmentRepo: IExamAssignmentRepository,
    private examRepo: IExamRepository,
    private userRepo: IUserRepository
  ) {}

  async execute(input: AssignExamToStudentInput): Promise<ExamAssignment> {
    // Validate exam exists and belongs to teacher
    const exam = await this.examRepo.findById(input.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    if (exam.userId !== input.teacherId) {
      throw new Error('You can only assign your own exams');
    }

    // Validate student exists and has STUDENT role
    const student = await this.userRepo.findById(UserId.create(input.studentId));
    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.isStudent()) {
      throw new Error('User is not a student');
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentRepo.findByExamAndStudent(
      input.examId,
      UserId.create(input.studentId)
    );

    if (existingAssignment) {
      throw new Error('Exam already assigned to this student');
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
