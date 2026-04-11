/**
 * Answer Grading Service Interface
 *
 * Service for automatically grading student answers using AI.
 * Used for evaluating short-answer questions that cannot be
 * auto-graded with simple string matching.
 */

export interface GradeAnswerInput {
  /** The question text */
  questionText: string;
  /** The correct answer as defined by the teacher/AI */
  correctAnswer: string;
  /** The student's submitted answer */
  studentAnswer: string;
  /** Maximum points for this question */
  points: number;
}

export interface GradeAnswerOutput {
  /** Whether the answer is considered correct (score >= 80%) */
  isCorrect: boolean;
  /** Calculated score based on similarity/accuracy (0 to points) */
  score: number;
  /** Optional feedback explaining the grade */
  feedback?: string;
}

/**
 * Service interface for grading answers using AI
 */
export interface IAnswerGradingService {
  /**
   * Grade a student's answer against the correct answer
   *
   * @param params - Grading parameters
   * @returns Grading result with score and feedback
   */
  gradeAnswer(params: GradeAnswerInput): Promise<GradeAnswerOutput>;
}
