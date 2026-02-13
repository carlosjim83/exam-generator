import { IExamAssignmentRepository } from '../../../domain/repositories/IExamAssignmentRepository.js';
import { ExamAssignment } from '../../../domain/entities/ExamAssignment.js';
import { AssignmentId } from '../../../domain/value-objects/AssignmentId.js';

export interface StartExamInput {
  assignmentId: string;
  studentId: string;
}

export class StartExamUseCase {
  constructor(private assignmentRepo: IExamAssignmentRepository) {}

  async execute(input: StartExamInput): Promise<ExamAssignment> {
    const assignment = await this.assignmentRepo.findById(AssignmentId.create(input.assignmentId));

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify ownership
    if (assignment.studentId.value !== input.studentId) {
      throw new Error('You can only start your own assignments');
    }

    // Start the exam (domain logic validates status)
    const startedAssignment = assignment.start();

    // Persist changes
    const updated = await this.assignmentRepo.update(startedAssignment);

    return updated;
  }
}
