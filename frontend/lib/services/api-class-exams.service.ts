/**
 * Class Exams API Service
 *
 * Handles all API calls for assigning exams to classes.
 * Teachers can assign/manage exams, students can view available exams.
 */

import { apiClient } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

/**
 * Class exam data returned by the API
 */
export interface ClassExam {
  id: string;
  classId: string;
  examId: string;
  examTitle: string;
  questionCount: number;
  availableAt: string | null;
  dueDate: string | null;
  timeLimit: number | null;
  isPublished: boolean;
  maxAttempts: number;
  showResultsImmediately: boolean;
  assignedStudents: number;
  startedCount?: number;
  submittedCount?: number;
  gradedCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Class exam for student view
 */
export interface StudentClassExam {
  id: string;
  classId: string;
  className: string;
  examId: string;
  examTitle: string;
  questionCount: number;
  availableAt: string | null;
  dueDate: string | null;
  timeLimit: number | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  attemptNumber: number;
  remainingAttempts: number;
  assignmentId: string | null;
}

/**
 * Request to assign an exam to a class
 */
export interface AssignExamRequest {
  examId: string;
  availableAt?: string | null;
  dueDate?: string | null;
  timeLimit?: number | null;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
}

/**
 * Request to update class exam settings
 */
export interface UpdateClassExamRequest {
  availableAt?: string | null;
  dueDate?: string | null;
  timeLimit?: number | null;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
}

/**
 * Request to publish/unpublish a class exam
 */
export interface PublishClassExamRequest {
  isPublished: boolean;
}

/**
 * Exam result for a student
 */
export interface StudentExamResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string | null;
  submittedAt: string | null;
  timeTaken: number | null;
  score: number | null;
  attemptNumber: number;
}

/**
 * Class exam results response
 */
export interface ClassExamResultsResponse {
  examTitle: string;
  classExamId: string;
  results: StudentExamResult[];
  statistics: {
    totalStudents: number;
    startedCount: number;
    submittedCount: number;
    gradedCount: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
}

/**
 * Available exam for assignment (teacher's exam library)
 */
export interface AvailableExam {
  id: string;
  title: string;
  questionCount: number;
  createdAt: string;
}

/**
 * Question result in a student submission
 */
export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
}

/**
 * Student info in submission detail
 */
export interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Assignment info in submission detail
 */
export interface AssignmentInfo {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
}

/**
 * Student submission detail response
 */
export interface StudentSubmissionDetailResponse {
  student: StudentInfo;
  exam: {
    id: string;
    title: string;
    description: string | null;
  };
  assignment: AssignmentInfo;
  questions: QuestionResult[];
  totalScore: number;
  maxScore: number;
  percentage: number | null;
}

// ============================================================================
// API Functions - Teacher Endpoints
// ============================================================================

/**
 * Assign an exam to a class
 * @param classId - The class ID
 * @param data - Exam assignment data
 */
export async function assignExamToClass(
  classId: string,
  data: AssignExamRequest
): Promise<ClassExam> {
  return apiClient.post<ClassExam>(`/api/classes/${classId}/exams`, data);
}

/**
 * Get all exams assigned to a class (teacher view)
 * @param classId - The class ID
 */
export async function getClassExams(classId: string): Promise<{ exams: ClassExam[] }> {
  return apiClient.get<{ exams: ClassExam[] }>(`/api/classes/${classId}/exams`);
}

/**
 * Publish or unpublish a class exam
 * @param classId - The class ID
 * @param classExamId - The class exam ID
 * @param isPublished - Whether to publish or unpublish
 */
export async function publishClassExam(
  classId: string,
  classExamId: string,
  isPublished: boolean
): Promise<ClassExam> {
  return apiClient.patch<ClassExam>(`/api/classes/${classId}/exams/${classExamId}/publish`, {
    isPublished,
  });
}

/**
 * Update class exam settings
 * @param classId - The class ID
 * @param classExamId - The class exam ID
 * @param data - Updated settings
 */
export async function updateClassExamSettings(
  classId: string,
  classExamId: string,
  data: UpdateClassExamRequest
): Promise<ClassExam> {
  return apiClient.patch<ClassExam>(`/api/classes/${classId}/exams/${classExamId}/settings`, data);
}

/**
 * Get exam results for a class exam
 * @param classId - The class ID
 * @param classExamId - The class exam ID
 */
export async function getClassExamResults(
  classId: string,
  classExamId: string
): Promise<ClassExamResultsResponse> {
  return apiClient.get<ClassExamResultsResponse>(
    `/api/classes/${classId}/exams/${classExamId}/results`
  );
}

/**
 * Remove an exam from a class
 * @param classId - The class ID
 * @param classExamId - The class exam ID
 */
export async function deleteClassExam(classId: string, classExamId: string): Promise<void> {
  await apiClient.delete(`/api/classes/${classId}/exams/${classExamId}`);
}

/**
 * Get detailed submission for a specific student
 * @param classId - The class ID
 * @param classExamId - The class exam ID
 * @param studentId - The student ID
 */
export async function getStudentSubmissionDetail(
  classId: string,
  classExamId: string,
  studentId: string
): Promise<StudentSubmissionDetailResponse> {
  return apiClient.get<StudentSubmissionDetailResponse>(
    `/api/classes/${classId}/exams/${classExamId}/students/${studentId}`
  );
}

// ============================================================================
// API Functions - Student Endpoints
// ============================================================================

/**
 * Get exams available to a student for a specific class
 * @param classId - The class ID
 */
export async function getStudentClassExams(
  classId: string
): Promise<{ exams: StudentClassExam[] }> {
  return apiClient.get<{ exams: StudentClassExam[] }>(`/api/classes/${classId}/exams/available`);
}
