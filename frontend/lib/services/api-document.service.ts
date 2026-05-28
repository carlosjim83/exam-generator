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
import { configManager } from '@/lib/config/config-manager';
import { TokenManager } from '@/lib/api-client';

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
  private get API_BASE_URL(): string {
    return configManager.getApiUrl();
  }

  private getAuthToken(): string | null {
    return TokenManager.getAccessToken();
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

    const token = this.getAuthToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true; // Send httpOnly cookies for OAuth auth

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
      xhr.open('POST', `${this.API_BASE_URL}/api/documents/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  /**
   * List all documents for the authenticated user
   */
  async listDocuments(): Promise<Document[]> {
    const token = this.getAuthToken();

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/documents`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
    } catch {
      return [];
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const token = this.getAuthToken();

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/documents/${id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Retry processing a failed or stuck document
   */
  async reprocessDocument(id: string): Promise<{ id: string; status: string; message: string }> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/api/documents/${id}/reprocess`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to retry document processing');
    }

    return await response.json();
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(id: string): Promise<void> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/api/documents/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * Download a document by ID
   * @returns Blob of the document file
   */
  async downloadDocument(id: string): Promise<Blob> {
    const token = this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/api/documents/${id}/download`, {
      method: 'GET',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to download document');
    }

    return await response.blob();
  }

  /**
   * Download a document and trigger browser download
   * @param id - Document ID
   * @param filename - Filename for the download
   */
  async downloadDocumentAsFile(id: string, filename: string): Promise<void> {
    const blob = await this.downloadDocument(id);

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Singleton instance of the document service.
 * Use this for all document API operations.
 */
export const documentService = new ApiDocumentService();
