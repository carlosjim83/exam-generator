// Shared types between frontend and backend

// ========================
// User Types
// ========================

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  MICROSOFT = 'MICROSOFT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// Document Types
// ========================

export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  blobUrl: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  errorMessage?: string;
  userId: string;
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// Exam Types
// ========================

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Question {
  id: string;
  examId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: QuestionDifficulty;
  position: number;
}

export interface Exam {
  id: string;
  title: string;
  topic: string;
  documentIds: string[];
  userId: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// API Request/Response Types
// ========================

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Documents
export interface UploadUrlRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadUrlResponse {
  documentId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface ConfirmUploadRequest {
  documentId: string;
  filename: string;
  title?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Exams
export interface GenerateExamRequest {
  documentIds: string[];
  topic: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionType: 'multiple-choice'; // Future: 'true-false', 'short-answer'
}

export interface GenerateExamResponse {
  exam: Exam;
  warning?: string;
}

export interface ExamListResponse {
  exams: Array<
    Omit<Exam, 'questions'> & {
      questionCount: number;
      documentTitles: string[];
    }
  >;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ========================
// API Error Response
// ========================

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// ========================
// Utility Types
// ========================

export type Paginated<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};
