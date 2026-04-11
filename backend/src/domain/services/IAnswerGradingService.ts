/**
 * IAnswerGradingService Interface (Port)
 * Defines contract for AI-powered answer grading
 */

export interface GradeAnswerInput {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  points: number;
}

export interface GradeAnswerOutput {
  isCorrect: boolean;
  score: number;
  feedback?: string;
  explanation?: string;
}

export interface IAnswerGradingService {
  gradeAnswer(params: GradeAnswerInput): Promise<GradeAnswerOutput>;
}
