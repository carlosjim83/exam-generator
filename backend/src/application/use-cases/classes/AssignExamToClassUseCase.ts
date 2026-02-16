import { IClassRepository } from '@domain/repositories/IClassRepository.js';
import { IStudentEnrollmentRepository } from '@domain/repositories/IStudentEnrollmentRepository.js';
import { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export class AssignExamToClassCommand {
  constructor(
    public classId: string,
    public examId: string,
    public teacherId: string,
    public dueDate?: Date,
    public excludeStudentIds?: string[]
  ) {}
}

export class AssignExamToClassUseCase {
  constructor(
    private classRepository: IClassRepository,
    private enrollmentRepository: IStudentEnrollmentRepository,
    private assignmentRepository: IExamAssignmentRepository
  ) {}

  async execute(
    command: AssignExamToClassCommand
  ): Promise<{ assigned: number; alreadyAssigned: number }> {
    const classId = new ClassId(command.classId);
    const examId = command.examId;
    const teacherId = UserId.create(command.teacherId);

    // Check if class exists
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new Error('Class not found');
    }

    // Get active students in class
    const result = await this.enrollmentRepository.findByClassId(classId, {
      activeOnly: true,
    });

    if (result.enrollments.length === 0) {
      throw new Error('Class has no students');
    }

    const excludeStudentIds = command.excludeStudentIds || [];
    const alreadyAssigned = new Set<string>();

    // Create assignments for each student (excluding if specified)
    const assignments: any[] = [];
    for (const enrollment of result.enrollments) {
      // Skip if student is excluded
      if (excludeStudentIds.includes(enrollment.studentId.toString())) {
        continue;
      }

      // Check if already assigned
      const existingAssignment = await this.assignmentRepository.findByExamAndStudent(
        examId,
        enrollment.studentId
      );

      if (existingAssignment) {
        alreadyAssigned.add(enrollment.studentId.toString());
        continue;
      }

      // Create assignment
      assignments.push({
        examId,
        studentId: enrollment.studentId,
        teacherId,
        dueDate: command.dueDate,
      });
    }

    // Bulk create assignments
    const createdAssignments = await Promise.all(
      assignments.map((data) => this.assignmentRepository.create(data))
    );

    return {
      assigned: createdAssignments.length,
      alreadyAssigned: alreadyAssigned.size,
    };
  }
}
