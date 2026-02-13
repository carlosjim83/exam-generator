import { IExamAssignmentRepository } from '../../../domain/repositories/IExamAssignmentRepository.js';
import { IStudentAnswerRepository } from '../../../domain/repositories/IStudentAnswerRepository.js';
import { IExamRepository } from '../../../domain/repositories/IExamRepository.js';
import { ExamAssignment } from '../../../domain/entities/ExamAssignment.js';
import { StudentAnswer } from '../../../domain/entities/StudentAnswer.js';
import { AssignmentId } from '../../../domain/value-objects/AssignmentId.js';

export interface SubmitExamAnswersInput {
  assignmentId: string;
  studentId: string;
  answers: Array<{
    questionId: string;
    answerText: string;
  }>;
}

export class SubmitExamAnswersUseCase {
  constructor(
    private assignmentRepo: IExamAssignmentRepository,
    private answerRepo: IStudentAnswerRepository,
    private examRepo: IExamRepository
  ) {}

  async execute(input: SubmitExamAnswersInput): Promise<ExamAssignment> {
    // Find assignment
    const assignment = await this.assignmentRepo.findById(AssignmentId.create(input.assignmentId));

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify ownership
    if (assignment.studentId.value !== input.studentId) {
      throw new Error('You can only submit your own assignments');
    }

    // Get exam with questions
    const exam = await this.examRepo.findByIdWithQuestions(assignment.examId);

    if (!exam) {
      throw new Error('Exam not found');
    }

    if (!exam.questions || exam.questions.length === 0) {
      throw new Error('Exam has no questions');
    }

    // Validate all questions belong to exam
    const examQuestionIds = exam.questions.map((q: any) => q.id);
    for (const answer of input.answers) {
      if (!examQuestionIds.includes(answer.questionId)) {
        throw new Error(`Question ${answer.questionId} does not belong to this exam`);
      }
    }

    // Save answers and grade them
    const gradedAnswers: StudentAnswer[] = [];
    for (const answerInput of input.answers) {
      const question = exam.questions!.find((q: any) => q.id === answerInput.questionId);
      if (!question) continue;

      // Upsert answer
      const answer = await this.answerRepo.upsert({
        assignmentId: assignment.id,
        questionId: answerInput.questionId,
        answerText: answerInput.answerText,
      });

      // Grade answer
      const graded = answer.grade(question.correctAnswer);
      const updated = await this.answerRepo.update(graded);
      gradedAnswers.push(updated);
    }

    // Calculate score
    const correctAnswers = gradedAnswers.filter((a) => a.isCorrect === true).length;
    const totalQuestions = exam.questions!.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Submit assignment with score
    const submittedAssignment = assignment.submit(score);

    // Persist
    const updated = await this.assignmentRepo.update(submittedAssignment);

    return updated;
  }
}
