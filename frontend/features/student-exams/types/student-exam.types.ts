/**
 * Student Exam Types
 *
 * Domain types for the Student Exam feature following backend API contracts
 */

export type ExamAssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface Question {
  id: string;
  text: string;
  order: number;
  type: QuestionType;
  options: string[];
}

export interface StudentAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAssignment {
  id: string;
  examId: string;
  studentId: string;
  status: ExamAssignmentStatus;
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  exam?: Exam;
  answers?: StudentAnswer[];
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  documentId: string;
  createdBy: string;
  createdAt: string;
  questions?: Question[];
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface StudentExamListItem {
  id: string; // assignment ID
  examId: string;
  examTitle: string;
  examDescription: string | null;
  status: ExamAssignmentStatus;
  questionCount: number;
  maxScore: number;
  score: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface StartExamResponse {
  assignment: ExamAssignment;
  exam: ExamWithQuestions;
}

export interface SaveAnswerResponse {
  saved: boolean;
  questionId: string;
}

export interface SubmitAnswerRequest {
  assignmentId: string;
  questionId: string;
  answer: string;
}

export interface SubmitAnswerResponse {
  answer: StudentAnswer;
  message: string;
}

export interface SubmitExamRequest {
  assignmentId: string;
}

export interface SubmitExamResponse {
  assignment: ExamAssignment;
  message: string;
}

export interface ExamResultsData {
  assignment: ExamAssignment;
  exam: ExamWithQuestions;
  answers: StudentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
}
