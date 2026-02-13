import { StudentAnswer } from '../entities/StudentAnswer.js';
import { AssignmentId } from '../value-objects/AssignmentId.js';

export interface CreateStudentAnswerDTO {
  assignmentId: AssignmentId;
  questionId: string;
  answerText: string;
}

/**
 * IStudentAnswerRepository Interface (Port)
 * Defines operations for StudentAnswer persistence
 */
export interface IStudentAnswerRepository {
  findById(id: string): Promise<StudentAnswer | null>;

  findByAssignment(assignmentId: AssignmentId): Promise<StudentAnswer[]>;

  findByAssignmentAndQuestion(
    assignmentId: AssignmentId,
    questionId: string
  ): Promise<StudentAnswer | null>;

  create(data: CreateStudentAnswerDTO): Promise<StudentAnswer>;

  update(answer: StudentAnswer): Promise<StudentAnswer>;

  upsert(data: CreateStudentAnswerDTO): Promise<StudentAnswer>;

  deleteByAssignment(assignmentId: AssignmentId): Promise<void>;
}
