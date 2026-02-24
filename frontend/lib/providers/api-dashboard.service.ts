/**
 * API Dashboard Service
 *
 * Makes HTTP requests to the backend API for dashboard data.
 * Returns empty data when user is not authenticated.
 */

import type { Document, Exam, DashboardStats } from '../types/dashboard.types';
import { configManager } from '@/lib/config/config-manager';
import { TokenManager } from '@/lib/api-client';

export class ApiDashboardService {
  private get baseUrl(): string {
    return configManager.getApiUrl();
  }

  constructor() {
    // Empty constructor - baseUrl is now a getter
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
      console.warn('[ApiDashboardService] No access token found, skipping API call to', endpoint);
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
      console.warn('[ApiDashboardService] User not authenticated, returning empty stats');
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
    } catch (error) {
      // Endpoint doesn't exist yet - fall back to teacher dashboard
      console.warn(
        '[ApiDashboardService] /api/dashboard/stats not implemented, falling back to /api/teacher/dashboard'
      );

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
      } catch (fallbackError) {
        console.error('[ApiDashboardService] Both endpoints failed:', error, fallbackError);

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
      console.warn('[ApiDashboardService] User not authenticated, returning empty documents');
      return [];
    }

    try {
      // Call the existing /api/documents endpoint
      const response = await this.fetchWithAuth<{ documents: any[] }>('/api/documents');

      // If no response, return empty array
      if (!response) {
        return [];
      }

      // Transform backend response to frontend Document type
      const documents = response.documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType || 'application/pdf', // Fallback for older data
        status: doc.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
        uploadedAt: new Date(doc.uploadedAt),
        processedAt: doc.processedAt ? new Date(doc.processedAt) : null,
        pageCount: doc.pageCount || null,
        wordCount: doc.wordCount || null,
      }));

      // Backend doesn't support limit query param yet, so slice client-side
      // TODO: Backend should support ?limit=5 query parameter (see ENDPOINTS_TODO.md)
      return documents
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()) // Sort by most recent
        .slice(0, limit);
    } catch (error) {
      console.error('[ApiDashboardService] Failed to fetch documents:', error);
      return [];
    }
  }

  async getRecentExams(limit: number = 5): Promise<Exam[]> {
    // If not authenticated, return empty array
    if (!this.isAuthenticated()) {
      console.warn('[ApiDashboardService] User not authenticated, returning empty exams');
      return [];
    }

    try {
      // Call /api/exams endpoint
      const response = await this.fetchWithAuth<{ exams: any[] }>('/api/exams');

      // If no response, return empty array
      if (!response) {
        return [];
      }

      const exams = response.exams.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        status: 'draft' as const, // Backend doesn't have status field yet
        questionsCount: exam.questionCount || 0,
        gradeLevel: 'N/A', // Backend doesn't have gradeLevel yet
        createdAt: new Date(exam.createdAt),
        updatedAt: new Date(exam.createdAt), // Backend doesn't have updatedAt
      }));

      return exams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
    } catch (error) {
      console.error('[ApiDashboardService] Failed to fetch exams:', error);
      return [];
    }
  }
}
