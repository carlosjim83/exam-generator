import type {
  StudentExamListItem,
  StartExamResponse,
  SaveAnswerResponse,
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
   * Also used to resume an exam that is already IN_PROGRESS
   */
  async startExam(assignmentId: string): Promise<StartExamResponse> {
    return apiClient.post<StartExamResponse>(`/api/students/assignments/${assignmentId}/start`, {});
  }

  /**
   * Save a single answer WITHOUT submitting the exam
   * Use this to save progress as student navigates through questions
   */
  async saveAnswer(
    assignmentId: string,
    questionId: string,
    answerText: string
  ): Promise<SaveAnswerResponse> {
    return apiClient.post<SaveAnswerResponse>(`/api/students/assignments/${assignmentId}/answers`, {
      questionId,
      answerText,
    });
  }

  /**
   * Submit the complete exam (finalize and mark as SUBMITTED)
   * This will grade multiple-choice questions automatically
   */
  async submitExam(
    assignmentId: string,
    answers: Array<{ questionId: string; answerText: string }>
  ): Promise<SubmitExamResponse> {
    return apiClient.post<SubmitExamResponse>(`/api/students/assignments/${assignmentId}/submit`, {
      answers,
    });
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
