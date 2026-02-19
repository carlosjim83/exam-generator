/**
 * Classes API Service
 *
 * Handles all API calls for the Classes & Invitations feature.
 * Follows the pattern from features/exams/services/exams-api.ts
 */

import { configManager } from '@/lib/config/config-manager';

// Types
export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  teacherId: string;
  studentCount: number;
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

// Helper to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Helper to make authenticated requests
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const baseUrl = configManager.getApiUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new class
 */
export async function createClass(data: CreateClassRequest): Promise<CreateClassResponse> {
  return fetchWithAuth<CreateClassResponse>('/api/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

  return fetchWithAuth<ListClassesResponse>(`/api/classes?${params.toString()}`);
}

/**
 * Get class details by ID
 */
export async function getClassById(classId: string): Promise<ClassDetails> {
  return fetchWithAuth<ClassDetails>(`/api/classes/${classId}`);
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
    return await fetchWithAuth(`/api/classes/code/${code}`);
  } catch {
    return null;
  }
}

/**
 * Delete a class
 */
export async function deleteClass(classId: string): Promise<void> {
  await fetchWithAuth(`/api/classes/${classId}`, {
    method: 'DELETE',
  });
}

/**
 * Join a class using access code
 */
export async function joinClass(data: JoinClassRequest): Promise<JoinClassResponse> {
  return fetchWithAuth<JoinClassResponse>('/api/classes/join', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

  return fetchWithAuth(`/api/classes/${classId}/students?${params.toString()}`);
}

/**
 * Remove a student from a class
 */
export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  await fetchWithAuth(`/api/classes/${classId}/students/${studentId}`, {
    method: 'DELETE',
  });
}

/**
 * Create invitations for students
 */
export async function createInvitations(
  classId: string,
  data: CreateInvitationsRequest
): Promise<CreateInvitationsResponse> {
  return fetchWithAuth<CreateInvitationsResponse>(`/api/classes/${classId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Import students from CSV
 */
export async function importStudentsFromCsv(
  classId: string,
  file: File
): Promise<ImportCsvResponse> {
  const token = getAuthToken();
  const baseUrl = configManager.getApiUrl();

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/classes/${classId}/invitations/csv`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List invitations for a class
 */
export async function listInvitations(classId: string): Promise<{ invitations: Invitation[] }> {
  return fetchWithAuth(`/api/classes/${classId}/invitations`);
}

/**
 * Accept an invitation by token
 */
export async function acceptInvitation(token: string): Promise<void> {
  await fetchWithAuth(`/api/invitations/${token}/accept`, {
    method: 'POST',
  });
}

/**
 * Resend an invitation
 */
export async function resendInvitation(token: string): Promise<void> {
  await fetchWithAuth(`/api/invitations/${token}/resend`, {
    method: 'POST',
  });
}
