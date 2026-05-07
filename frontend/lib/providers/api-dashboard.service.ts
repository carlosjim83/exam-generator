/**
 * API Dashboard Service
 *
 * Makes HTTP requests to the backend API for dashboard data.
 * Returns empty data when user is not authenticated.
 */

import type { Document, ClassExam, DashboardStats } from '../types/dashboard.types';
import { configManager } from '@/lib/config/config-manager';
import { TokenManager } from '@/lib/api-client';

interface RawDocument {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  processedAt?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
}

interface RawClassExam {
  id: string;
  examId: string;
  examTitle: string;
  classId: string;
  className: string;
  dueDate?: string | null;
  isPublished: boolean;
  questionCount: number;
  submittedCount: number;
  createdAt: string;
}

export class ApiDashboardService {
  private get baseUrl(): string {
    return configManager.getApiUrl();
  }

  /**
   * Make authenticated API request
   * Returns null if no token (graceful degradation)
   */
  private async fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    // Get access token from localStorage
    const accessToken = TokenManager.getAccessToken();

    if (!accessToken) {
      // Don't throw error - let callers handle gracefully
      return null;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for refresh token
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if user is authenticated
   */
  private isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  async getStats(): Promise<DashboardStats> {
    // If not authenticated, return empty stats
    if (!this.isAuthenticated()) {
      return {
        totalDocuments: 0,
        totalExams: 0,
        documentsChange: '0%',
        examsChange: '0%',
        lastActivity: {
          timestamp: new Date(),
          description: 'Please log in to view your activity',
        },
      };
    }

    try {
      // Try to call the real endpoint: GET /api/dashboard/stats
      const response = await this.fetchWithAuth<{
        totalDocuments: number;
        totalExams: number;
        documentsChange: string;
        examsChange: string;
        lastActivity: {
          timestamp: string;
          description: string;
        };
      }>('/api/dashboard/stats');

      // If no response (user not authenticated), fall through to catch
      if (!response) {
        throw new Error('No response from API');
      }

      return {
        totalDocuments: response.totalDocuments,
        totalExams: response.totalExams,
        documentsChange: response.documentsChange,
        examsChange: response.examsChange,
        lastActivity: {
          timestamp: new Date(response.lastActivity.timestamp),
          description: response.lastActivity.description,
        },
      };
    } catch {
      try {
        const fallback = await this.fetchWithAuth<{
          data: { totalDocuments: number; totalExams: number };
        }>('/api/teacher/dashboard');

        // If no fallback response, return empty stats
        if (!fallback) {
          throw new Error('No fallback response');
        }

        return {
          totalDocuments: fallback.data.totalDocuments,
          totalExams: fallback.data.totalExams,
          documentsChange: 'N/A',
          examsChange: 'N/A',
          lastActivity: {
            timestamp: new Date(),
            description: 'Activity tracking not available',
          },
        };
      } catch {
        // Return empty stats as last resort
        return {
          totalDocuments: 0,
          totalExams: 0,
          documentsChange: '0%',
          examsChange: '0%',
          lastActivity: {
            timestamp: new Date(),
            description: 'No activity yet',
          },
        };
      }
    }
  }

  async getRecentDocuments(limit: number = 5): Promise<Document[]> {
    // If not authenticated, return empty array
    if (!this.isAuthenticated()) {
      return [];
    }

    try {
      // Call the existing /api/documents endpoint
      const response = await this.fetchWithAuth<{ documents: RawDocument[] }>('/api/documents');

      // If no response, return empty array
      if (!response) {
        return [];
      }

      // Transform backend response to frontend Document type
      const documents = response.documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType || 'application/pdf', // Fallback for older data
        status: doc.status,
        uploadedAt: new Date(doc.uploadedAt),
        processedAt: doc.processedAt ? new Date(doc.processedAt) : null,
        pageCount: doc.pageCount ?? null,
        wordCount: doc.wordCount ?? null,
      }));

      documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // Sort by most recent
      return documents.slice(0, limit);
    } catch {
      return [];
    }
  }

  async getRecentClassExams(limit: number = 5): Promise<ClassExam[]> {
    // If not authenticated, return empty array
    if (!this.isAuthenticated()) {
      return [];
    }

    try {
      // Call /api/dashboard/class-exams endpoint
      const response = await this.fetchWithAuth<{ classExams: RawClassExam[] }>(
        '/api/dashboard/class-exams',
        {
          method: 'GET',
        }
      );

      // If no response, return empty array
      if (!response) {
        return [];
      }

      const classExams = response.classExams.map((exam) => ({
        id: exam.id,
        examId: exam.examId,
        examTitle: exam.examTitle,
        classId: exam.classId,
        className: exam.className,
        dueDate: exam.dueDate ? new Date(exam.dueDate) : null,
        isPublished: exam.isPublished,
        questionCount: exam.questionCount,
        submittedCount: exam.submittedCount,
        createdAt: new Date(exam.createdAt),
      }));

      return classExams.slice(0, limit);
    } catch {
      return [];
    }
  }
}

/**
 * Singleton instance of the dashboard service.
 * Use this for all dashboard API operations.
 */
export const dashboardService = new ApiDashboardService();
