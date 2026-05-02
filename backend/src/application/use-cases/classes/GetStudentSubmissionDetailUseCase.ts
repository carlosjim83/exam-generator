import { ConflictError, NotFoundError } from '@domain/errors/DomainError.js';
import { assertOwnership } from '@domain/utils/assertOwnership.js';
import type { IClassExamRepository } from '@domain/repositories/IClassExamRepository.js';
import type { IClassRepository } from '@domain/repositories/IClassRepository.js';
import type { IExamAssignmentRepository } from '@domain/repositories/IExamAssignmentRepository.js';
import type { IExamRepository } from '@domain/repositories/IExamRepository.js';
import type { IStudentAnswerRepository } from '@domain/repositories/IStudentAnswerRepository.js';
import type { IUserRepository } from '@domain/repositories/IUserRepository.js';
import { ClassExamId } from '@domain/value-objects/ClassExamId.js';
import { ClassId } from '@domain/value-objects/ClassId.js';
import { UserId } from '@domain/value-objects/UserId.js';

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

export interface AssignmentInfo {
  id: string;
  status: string;
  startedAt: Date | null;
  submittedAt: Date | null;
  score: number | null;
}

export interface GetStudentSubmissionDetailInput {
  classExamId: string;
  classId: string;
  studentId: string;
  teacherId: string;
}

export interface GetStudentSubmissionDetailOutput {
  student: StudentInfo;
  exam: {
    id: string;
    title: string;
    description: string | null;
  };
  assignment: AssignmentInfo;
  questions: QuestionResult[];
  totalScore: number;
  maxScore: number;
  percentage: number | null;
}

/**
 * GetStudentSubmissionDetailUseCase
 *
 * Gets detailed submission results for a specific student (teacher view).
 * Shows each question with the student's answer and grading info.
 */
export class GetStudentSubmissionDetailUseCase {
  constructor(
    private readonly classExamRepository: IClassExamRepository,
    private readonly classRepository: IClassRepository,
    private readonly examRepository: IExamRepository,
    private readonly assignmentRepository: IExamAssignmentRepository,
    private readonly studentAnswerRepository: IStudentAnswerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: GetStudentSubmissionDetailInput): Promise<GetStudentSubmissionDetailOutput> {
    const classExamId = ClassExamId.create(input.classExamId);
    const classId = ClassId.create(input.classId);
    const teacherId = UserId.create(input.teacherId);
    const studentId = UserId.create(input.studentId);

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

    // Get exam details with questions
    const exam = await this.examRepository.findByIdWithQuestions(classExam.examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Get student info
    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Get assignment for this student and class exam
    const assignments = await this.assignmentRepository.findByClassExamId(classExamId);
    const assignment = assignments.find((a) => a.studentId.equals(studentId));

    if (!assignment) {
      throw new ConflictError('Student has not been assigned this exam');
    }

    // Get student's answers
    const studentAnswers = await this.studentAnswerRepository.findByAssignment(assignment.id);

    // Build question results
    const questions: QuestionResult[] = (exam.questions || []).map((question) => {
      const answer = studentAnswers.find((a) => a.questionId === question.id);

      // Calculate points earned
      let pointsEarned = 0;
      if (answer?.isCorrect) {
        pointsEarned = question.points;
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.type as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
        options: question.options,
        correctAnswer: question.correctAnswer || '',
        studentAnswer: answer?.answerText || '',
        isCorrect: answer?.isCorrect ?? null,
        pointsEarned,
        maxPoints: question.points,
      };
    });

    // Calculate totals
    const maxScore = questions.reduce((sum, q) => sum + q.maxPoints, 0);
    const totalScore = questions.reduce((sum, q) => sum + q.pointsEarned, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;

    return {
      student: {
        id: student.id.toString(),
        name: student.fullName,
        email: student.email.value,
      },
      exam: {
        id: exam.id.toString(),
        title: exam.title,
        description: exam.description ?? null,
      },
      assignment: {
        id: assignment.id.toString(),
        status: assignment.status,
        startedAt: assignment.startedAt,
        submittedAt: assignment.submittedAt,
        score: assignment.score,
      },
      questions,
      totalScore,
      maxScore,
      percentage,
    };
  }
}
