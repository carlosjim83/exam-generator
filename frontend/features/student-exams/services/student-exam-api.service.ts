import type {
  StudentExamListItem,
  StartExamResponse,
  SubmitAnswerResponse,
  SubmitExamResponse,
  ExamResultsData,
} from '../types';

/**
 * Student Exam API Service
 *
 * Handles all API calls related to student exam assignments
 */
export class StudentExamAPIService {
  private readonly baseUrl: string;

  constructor() {
    // Use runtime config from /api/config endpoint or fallback to env variable
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Get all exams assigned to the current student
   */
  async getAssignedExams(token: string): Promise<StudentExamListItem[]> {
    const response = await fetch(`${this.baseUrl}/student/exam-assignments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to fetch assigned exams: ${error.error || error.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.assignments;
  }

  /**
   * Start an exam (changes status from PENDING to IN_PROGRESS)
   */
  async startExam(assignmentId: string, token: string): Promise<StartExamResponse> {
    const response = await fetch(`${this.baseUrl}/student/exam-assignments/${assignmentId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to start exam: ${error.error || error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Submit an answer to a specific question
   */
  async submitAnswer(
    assignmentId: string,
    questionId: string,
    answer: string,
    token: string
  ): Promise<SubmitAnswerResponse> {
    const response = await fetch(
      `${this.baseUrl}/student/exam-assignments/${assignmentId}/answers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
          answer,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to submit answer: ${error.error || error.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  /**
   * Submit the complete exam (finalize and mark as SUBMITTED)
   */
  async submitExam(assignmentId: string, token: string): Promise<SubmitExamResponse> {
    const response = await fetch(
      `${this.baseUrl}/student/exam-assignments/${assignmentId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to submit exam: ${error.error || error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Get exam results (only available after grading)
   */
  async getExamResults(assignmentId: string, token: string): Promise<ExamResultsData> {
    const response = await fetch(
      `${this.baseUrl}/student/exam-assignments/${assignmentId}/results`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to fetch exam results: ${error.error || error.message || 'Unknown error'}`
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const studentExamAPI = new StudentExamAPIService();
