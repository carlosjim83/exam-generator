import { IExamAssignmentRepository } from '../../../domain/repositories/IExamAssignmentRepository.js';
import { IStudentAnswerRepository } from '../../../domain/repositories/IStudentAnswerRepository.js';
import { IExamRepository } from '../../../domain/repositories/IExamRepository.js';
import { ExamAssignment } from '../../../domain/entities/ExamAssignment.js';
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
      throw new Error('Assignment does not belong to student');
    }

    // Validate assignment can be submitted
    if (!assignment.canSubmit()) {
      throw new Error(`Cannot submit assignment with status ${assignment.status}`);
    }

    // Get exam with questions
    const exam = await this.examRepo.findByIdWithQuestions(assignment.examId);

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Validate all questions belong to exam
    const examQuestionIds = exam.questions?.map((q) => q.id) || [];
    for (const answer of input.answers) {
      if (!examQuestionIds.includes(answer.questionId)) {
        throw new Error(`Question ${answer.questionId} does not belong to exam`);
      }
    }

    // Save answers and auto-grade multiple-choice questions
    let totalScore = 0;
    for (const answerInput of input.answers) {
      const question = exam.questions?.find((q) => q.id === answerInput.questionId);
      if (!question) continue;

      // Create answer
      await this.answerRepo.create({
        assignmentId: assignment.id,
        questionId: answerInput.questionId,
        answerText: answerInput.answerText,
      });

      // Auto-grade if multiple-choice
      if (question.type === 'MULTIPLE_CHOICE' && question.correctAnswer) {
        const isCorrect = answerInput.answerText.trim() === question.correctAnswer.trim();
        if (isCorrect) {
          totalScore += question.points;
        }
      }
    }

    // Submit assignment with score
    const submittedAssignment = assignment.submit(totalScore);

    // Persist
    const updated = await this.assignmentRepo.update(submittedAssignment);

    return updated;
  }
}
