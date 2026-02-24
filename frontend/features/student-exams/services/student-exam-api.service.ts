import type {
  StudentExamListItem,
  StartExamResponse,
  SubmitAnswerResponse,
  SubmitExamResponse,
  ExamResultsData,
} from '../types';
import { apiClient } from '@/lib/api-client';

/**
 * Student Exam API Service
 *
 * Handles all API calls related to student exam assignments
 */
export class StudentExamAPIService {
  /**
   * Get all exams assigned to the current student
   */
  async getAssignedExams(): Promise<StudentExamListItem[]> {
    const response = await apiClient.get<{ assignments: StudentExamListItem[] }>(
      '/api/students/assignments'
    );
    return response.assignments;
  }

  /**
   * Start an exam (changes status from PENDING to IN_PROGRESS)
   */
  async startExam(assignmentId: string): Promise<StartExamResponse> {
    return apiClient.post<StartExamResponse>(`/api/students/assignments/${assignmentId}/start`, {});
  }

  /**
   * Submit an answer to a specific question
   */
  async submitAnswer(
    assignmentId: string,
    questionId: string,
    answer: string
  ): Promise<SubmitAnswerResponse> {
    return apiClient.post<SubmitAnswerResponse>(
      `/api/students/assignments/${assignmentId}/submit`,
      {
        answers: [{ questionId, answerText: answer }],
      }
    );
  }

  /**
   * Submit the complete exam (finalize and mark as SUBMITTED)
   */
  async submitExam(assignmentId: string): Promise<SubmitExamResponse> {
    return apiClient.post<SubmitExamResponse>(
      `/api/students/assignments/${assignmentId}/submit`,
      {}
    );
  }

  /**
   * Get exam results (only available after grading)
   */
  async getExamResults(assignmentId: string): Promise<ExamResultsData> {
    return apiClient.get<ExamResultsData>(`/api/students/assignments/${assignmentId}/results`);
  }
}

// Export singleton instance
export const studentExamAPI = new StudentExamAPIService();
