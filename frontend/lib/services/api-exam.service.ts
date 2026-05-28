/**
 * ApiExamService
 *
 * Handles all exam-related API operations:
 * - Generate exams from documents
 * - List exams
 * - Get exam details
 * - Delete exams
 */

'use client';

import { configManager } from '@/lib/config/config-manager';
import { TokenManager } from '@/lib/api-client';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';

export interface GenerateExamInput {
  documentIds: string[];
  title: string;
  description?: string;
  numQuestions?: number;
  difficulty?: Difficulty;
  questionTypes?: QuestionType[];
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  orderIndex?: number;
}

export interface ExamResponse {
  exam: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    documentCount: number;
    createdAt: string;
  };
  questions: Question[];
  generationTimeMs: number;
}

export interface ExamListItem {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  documentCount: number;
  createdAt: string;
}

export interface ExamDetailsResponse {
  exam: {
    id: string;
    title: string;
    description?: string;
    questionCount: number;
    documentCount: number;
    createdAt: string;
    updatedAt: string;
  };
  questions: Question[];
}

export class ApiExamService {
  private get API_BASE_URL(): string {
    return configManager.getApiUrl();
  }

  private getAuthToken(): string | null {
    return TokenManager.getAccessToken();
  }

  /**
   * Generate a new exam from documents
   */
  async generateExam(input: GenerateExamInput): Promise<ExamResponse> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/api/exams/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        documentIds: input.documentIds,
        title: input.title,
        description: input.description,
        numQuestions: input.numQuestions || 10,
        difficulty: input.difficulty || 'MIXED',
        questionTypes: input.questionTypes || ['MULTIPLE_CHOICE'],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to generate exam: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List all exams for the authenticated user
   */
  async listExams(): Promise<{ exams: ExamListItem[]; total: number }> {
    const token = this.getAuthToken();

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/exams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { exams: [], total: 0 };
        }
        throw new Error(`Failed to fetch exams: ${response.statusText}`);
      }

      return await response.json();
    } catch {
      return { exams: [], total: 0 };
    }
  }

  /**
   * Get a single exam by ID with all questions
   */
  async getExam(id: string): Promise<ExamDetailsResponse | null> {
    const token = this.getAuthToken();

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/exams/${id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch exam: ${response.statusText}`);
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Delete an exam by ID (if you implement this endpoint in backend)
   */
  async deleteExam(id: string): Promise<void> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/api/exams/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete exam: ${response.statusText}`);
    }
  }
}

/**
 * Singleton instance of the exam service.
 * Use this for all exam API operations.
 */
export const examService = new ApiExamService();
