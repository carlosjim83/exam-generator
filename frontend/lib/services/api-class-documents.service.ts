/**
 * Class Documents API Service
 *
 * Handles all API calls for sharing documents with classes.
 * Teachers can share/unshare documents, students can view shared documents.
 */

import { apiClient } from '@/lib/api-client';

// Types
export interface SharedDocument {
  id: string;
  documentId: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isVisible: boolean;
  publishedAt: string | null;
  orderIndex: number;
}

export interface ClassDocumentsResponse {
  class: {
    id: string;
    name: string;
    description: string | null;
  };
  documents: SharedDocument[];
}

export interface ShareDocumentRequest {
  classIds: string[];
  isVisible?: boolean;
}

export interface ShareDocumentResponse {
  documentId: string;
  sharedWith: {
    classId: string;
    isVisible: boolean;
    publishedAt: string | null;
  }[];
}

export interface DocumentSharedWith {
  classId: string;
  className: string;
  isVisible: boolean;
  publishedAt: string | null;
}

export interface DocumentSharesResponse {
  documentId: string;
  sharedWith: DocumentSharedWith[];
}

/**
 * Share a document with one or more classes
 * @param documentId - The document ID to share
 * @param data - Class IDs and visibility setting
 */
export async function shareDocument(
  documentId: string,
  data: ShareDocumentRequest
): Promise<ShareDocumentResponse> {
  return apiClient.post<ShareDocumentResponse>(`/api/documents/${documentId}/share`, data);
}

/**
 * Unshare a document from a class
 * @param documentId - The document ID
 * @param classId - The class ID to unshare from
 */
export async function unshareDocument(documentId: string, classId: string): Promise<void> {
  await apiClient.delete(`/api/documents/${documentId}/share/${classId}`);
}

/**
 * Get all documents shared with a class (for students)
 * @param classId - The class ID
 */
export async function getClassDocuments(classId: string): Promise<ClassDocumentsResponse> {
  return apiClient.get<ClassDocumentsResponse>(`/api/classes/${classId}/documents`);
}

/**
 * Get classes that a document is shared with (for teachers)
 * @param documentId - The document ID
 */
export async function getDocumentShares(
  documentId: string
): Promise<DocumentSharesResponse | null> {
  try {
    return await apiClient.get<DocumentSharesResponse>(`/api/documents/${documentId}/shares`);
  } catch (error) {
    console.error('Failed to get document shares:', error);
    return null;
  }
}

/**
 * Update document visibility for a specific class
 * Teacher can publish/unpublish a shared document for students
 * @param documentId - The document ID
 * @param classId - The class ID
 * @param isVisible - Whether the document should be visible to students
 */
export async function updateDocumentVisibility(
  documentId: string,
  classId: string,
  isVisible: boolean
): Promise<{
  id: string;
  classId: string;
  documentId: string;
  isVisible: boolean;
  publishedAt: string | null;
}> {
  return apiClient.patch<{
    id: string;
    classId: string;
    documentId: string;
    isVisible: boolean;
    publishedAt: string | null;
  }>(`/api/documents/${documentId}/share/${classId}`, { isVisible });
}
