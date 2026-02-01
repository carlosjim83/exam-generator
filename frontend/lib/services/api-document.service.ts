/**
 * ApiDocumentService
 *
 * Handles all document-related API operations:
 * - Upload documents (multipart/form-data)
 * - List documents
 * - Get document details
 * - Delete documents
 */

'use client';

import type { Document } from '../types/dashboard.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UploadDocumentInput {
  file: File;
  title?: string;
}

export interface UploadDocumentResponse {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  blobUrl: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ApiDocumentService {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Upload a document (PDF or DOCX)
   * @param input - File and optional title
   * @param onProgress - Optional callback for upload progress
   * @returns Uploaded document metadata
   */
  async uploadDocument(
    input: UploadDocumentInput,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadDocumentResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(input.file.type)) {
      throw new Error('Invalid file type. Only PDF and DOCX files are allowed.');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (input.file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', input.file);
    if (input.title) {
      formData.append('title', input.title);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            });
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      xhr.open('POST', `${API_BASE_URL}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /**
   * List all documents for the authenticated user
   */
  async listDocuments(): Promise<Document[]> {
    const token = this.getAuthToken();
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      // Backend returns { documents: [...] }, extract the array
      return Array.isArray(data) ? data : data.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const token = this.getAuthToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(id: string): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  }
}
