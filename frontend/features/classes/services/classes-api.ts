/**
 * Classes API Service
 *
 * Handles all API calls for the Classes & Invitations feature.
 * Uses the centralized apiClient from lib/api-client.ts
 */

import { apiClient, ApiError, TokenManager } from '@/lib/api-client';
import { configManager } from '@/lib/config/config-manager';

// Types
export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  studentCount: number;
  documentCount: number;
  examCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassRequest {
  name: string;
  description?: string;
}

export interface CreateClassResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  teacherId: string;
  createdAt: string;
}

export interface ListClassesResponse {
  classes: Class[];
  total: number;
  page: number;
  limit: number;
}

export interface JoinClassRequest {
  code: string;
}

export interface JoinClassResponse {
  classId: string;
  joinedAt: string;
}

export interface ClassDetails extends Class {
  students: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    joinedAt: string;
    isActive: boolean;
  }[];
}

export interface Invitation {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface CreateInvitationsRequest {
  emails: string[];
}

export interface CreateInvitationsResponse {
  invitations: {
    email: string;
    status: 'PENDING';
    expiresAt: string;
  }[];
}

export interface ImportCsvResponse {
  imported: number;
  failed: number;
  errors: string[];
}

/**
 * Create a new class
 */
export async function createClass(data: CreateClassRequest): Promise<CreateClassResponse> {
  return apiClient.post<CreateClassResponse>('/api/classes', data);
}

/**
 * List all classes for the current teacher
 */
export async function listClasses(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ListClassesResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);

  return apiClient.get<ListClassesResponse>(`/api/classes?${params.toString()}`);
}

/**
 * Get class details by ID
 */
export async function getClassById(classId: string): Promise<ClassDetails> {
  return apiClient.get<ClassDetails>(`/api/classes/${classId}`);
}

/**
 * Get class by code (for student join preview)
 */
export async function getClassByCode(code: string): Promise<{
  id: string;
  name: string;
  teacherName: string;
} | null> {
  try {
    return await apiClient.get(`/api/classes/code/${code}`);
  } catch {
    return null;
  }
}

/**
 * Delete a class
 */
export async function deleteClass(classId: string): Promise<void> {
  await apiClient.delete(`/api/classes/${classId}`);
}

/**
 * Join a class using class ID
 */
export async function joinClass(classId: string): Promise<JoinClassResponse> {
  return apiClient.post<JoinClassResponse>(`/api/classes/${classId}/join`, {});
}

/**
 * List students in a class
 */
export async function listClassStudents(
  classId: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{
  students: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    joinedAt: string;
    isActive: boolean;
  }[];
  total: number;
}> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);

  return apiClient.get(`/api/classes/${classId}/students?${params.toString()}`);
}

/**
 * Remove a student from a class
 */
export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  await apiClient.delete(`/api/classes/${classId}/students/${studentId}`);
}

/**
 * Create invitations for students
 */
export async function createInvitations(
  classId: string,
  data: CreateInvitationsRequest
): Promise<CreateInvitationsResponse> {
  return apiClient.post<CreateInvitationsResponse>(`/api/classes/${classId}/invitations`, data);
}

/**
 * Import students from CSV
 */
export async function importStudentsFromCsv(
  classId: string,
  file: File
): Promise<ImportCsvResponse> {
  const baseUrl = configManager.getApiUrl();

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  const accessToken = TokenManager.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${baseUrl}/api/classes/${classId}/invitations/csv`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * List invitations for a class
 */
export async function listInvitations(classId: string): Promise<{ invitations: Invitation[] }> {
  return apiClient.get(`/api/classes/${classId}/invitations`);
}

/**
 * Accept an invitation by token
 */
export async function acceptInvitation(token: string): Promise<void> {
  await apiClient.post(`/api/invitations/${token}/accept`, {});
}

/**
 * Resend an invitation
 */
export async function resendInvitation(token: string): Promise<void> {
  await apiClient.post(`/api/invitations/${token}/resend`, {});
}

/**
 * Get enrolled classes for current student
 */
export async function getMyClasses(): Promise<Class[]> {
  const response = await apiClient.get<{ classes: Class[] }>('/api/student/classes');
  return response.classes;
}
