import { ClassExam } from '@domain/entities/ClassExam.js';
import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';

export interface AssignExamToClassInput {
  classId: string;
  examId: string;
  teacherId: string;
  availableAt?: Date | null;
  dueDate?: Date | null;
  timeLimit?: number | null;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
  excludeStudentIds?: string[];
}

export interface AssignExamToClassOutput {
  classExamId: string;
  classId: string;
  examId: string;
  assignedStudents: number;
  alreadyAssigned: number;
}

/**
 * AssignExamToClassUseCase
 *
 * Assigns an exam to a class, creating ClassExam and ExamAssignments for all enrolled students.
 */
export class AssignExamToClassUseCase {
  constructor(
    private readonly classRepository: IClassRepository,
    private readonly examRepository: IExamRepository,
    private readonly classExamRepository: IClassExamRepository,
    private readonly enrollmentRepository: IStudentEnrollmentRepository,
    private readonly assignmentRepository: IExamAssignmentRepository
  ) {}

  async execute(input: AssignExamToClassInput): Promise<AssignExamToClassOutput> {
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);

    // Verify class exists and teacher owns it
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(classEntity.teacherId, teacherId, 'You are not the teacher of this class');

    // Verify exam exists and teacher owns it
    const exam = await this.examRepository.findById(input.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    assertOwnership(exam.userId, teacherId, 'You are not the owner of this exam');

    // Check if exam is already assigned to this class
    const existingClassExam = await this.classExamRepository.findByClassAndExam(
      classId,
      input.examId
    );
    if (existingClassExam) {
      throw new ConflictError('Exam is already assigned to this class');
    }

    // Create ClassExam
    const classExam = ClassExam.create({
      id: ClassExamId.create(crypto.randomUUID()),
      classId,
      examId: input.examId,
      teacherId,
      availableAt: input.availableAt ?? null,
      dueDate: input.dueDate ?? null,
      timeLimit: input.timeLimit ?? null,
      isPublished: false, // Draft by default
      maxAttempts: input.maxAttempts ?? 1,
      showResultsImmediately: input.showResultsImmediately ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.classExamRepository.save(classExam);

    // Get enrolled students
    const { enrollments } = await this.enrollmentRepository.findByClassId(classId, {
      activeOnly: true,
    });

    const excludeStudentIds = input.excludeStudentIds ?? [];
    let assignedCount = 0;
    let alreadyAssignedCount = 0;

    // Create ExamAssignments for each student
    for (const enrollment of enrollments) {
      // Skip excluded students
      if (excludeStudentIds.includes(enrollment.studentId.toString())) {
        continue;
      }

      // Check if already assigned
      const existingAssignment = await this.assignmentRepository.findByExamAndStudent(
        input.examId,
        enrollment.studentId
      );

      if (existingAssignment) {
        alreadyAssignedCount++;
        continue;
      }

      // Create assignment
      await this.assignmentRepository.create({
        examId: input.examId,
        studentId: enrollment.studentId,
        teacherId,
        dueDate: input.dueDate ?? undefined,
        classExamId: classExam.id.toString(),
      });

      assignedCount++;
    }

    return {
      classExamId: classExam.id.toString(),
      classId: input.classId,
      examId: input.examId,
      assignedStudents: assignedCount,
      alreadyAssigned: alreadyAssignedCount,
    };
  }
}
