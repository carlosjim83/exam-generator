import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface StudentResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  startedAt: Date | null;
  submittedAt: Date | null;
  timeTaken: number | null; // seconds
  score: number | null;
  attemptNumber: number;
}

export interface ClassExamStatistics {
  totalStudents: number;
  startedCount: number;
  submittedCount: number;
  gradedCount: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
}

export interface GetClassExamResultsInput {
  classExamId: string;
  classId: string;
  teacherId: string;
}

export interface GetClassExamResultsOutput {
  examTitle: string;
  classExamId: string;
  results: StudentResult[];
  statistics: ClassExamStatistics;
}

/**
 * GetClassExamResultsUseCase
 *
 * Gets the results of an exam for all students in a class (teacher view).
 */
export class GetClassExamResultsUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository,
    private readonly examRepository: IExamRepository,
    private readonly assignmentRepository: IExamAssignmentRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: GetClassExamResultsInput): Promise<GetClassExamResultsOutput> {
    const classExamId = ClassExamId.create(input.classExamId);
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);

    // Verify class exists and teacher owns it
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found');
    }

    assertOwnership(classEntity.teacherId, teacherId, 'You are not the teacher of this class');

    // Get the class exam
    const classExam = await this.classExamRepository.findById(classExamId);
    if (!classExam) {
      throw new NotFoundError('Class exam not found');
    }

    // Verify class exam belongs to this class
    if (!classExam.classId.equals(classId)) {
      throw new ConflictError('Class exam does not belong to this class');
    }

    // Get exam details
    const exam = await this.examRepository.findById(classExam.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Get all assignments for this class exam
    const assignments = await this.assignmentRepository.findByClassExamId(classExamId);

    // Build results with student info
    const results: StudentResult[] = await Promise.all(
      assignments.map(async (assignment) => {
        const timeTaken =
          assignment.startedAt && assignment.submittedAt
            ? Math.floor((assignment.submittedAt.getTime() - assignment.startedAt.getTime()) / 1000)
            : null;

        // Fetch student info from userRepository
        const student = await this.userRepository.findById(assignment.studentId);

        return {
          studentId: assignment.studentId.toString(),
          studentName: student ? student.fullName : 'Unknown Student',
          studentEmail: student ? student.email.value : '',
          status: assignment.status,
          startedAt: assignment.startedAt,
          submittedAt: assignment.submittedAt,
          timeTaken,
          score: assignment.score,
          attemptNumber: 1, // TODO: Track multiple attempts
        };
      })
    );

    // Calculate statistics
    const totalStudents = results.length;
    const startedCount = results.filter((r) => r.status !== 'PENDING').length;
    const submittedCount = results.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'GRADED'
    ).length;
    const gradedCount = results.filter((r) => r.status === 'GRADED').length;

    const scores = results.filter((r) => r.score !== null).map((r) => r.score as number);

    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null;
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

    return {
      examTitle: exam.title,
      classExamId: classExam.id.toString(),
      results,
      statistics: {
        totalStudents,
        startedCount,
        submittedCount,
        gradedCount,
        averageScore,
        highestScore,
        lowestScore,
      },
    };
  }
}
