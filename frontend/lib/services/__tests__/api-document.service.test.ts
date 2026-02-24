/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiDocumentService } from '@/lib/services/api-document.service';

describe('ApiDocumentService - Delete & Download', () => {
  let service: ApiDocumentService;
  let mockFetch: any;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Create service instance
    service = new ApiDocumentService();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await service.deleteDocument('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/documents/doc-123',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error when delete fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Document not found' }),
      });

      await expect(service.deleteDocument('doc-123')).rejects.toThrow('Document not found');
    });

    it('should throw error when not authenticated', async () => {
      // Mock localStorage with no token
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const unauthService = new ApiDocumentService();

      await expect(unauthService.deleteDocument('doc-123')).rejects.toThrow('Not authenticated');
    });
  });

  describe('downloadDocument', () => {
    it('should download a document successfully', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      const blob = await service.downloadDocument('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/documents/doc-123/download',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should throw error when download fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Document not found' }),
      });

      await expect(service.downloadDocument('doc-123')).rejects.toThrow('Document not found');
    });

    it('should throw error when not authenticated', async () => {
      // Mock localStorage with no token
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const unauthService = new ApiDocumentService();

      await expect(unauthService.downloadDocument('doc-123')).rejects.toThrow('Not authenticated');
    });
  });

  describe('downloadDocumentAsFile', () => {
    it('should trigger file download in browser', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      const mockURL = 'blob:mock-url';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const createObjectURL = vi.fn(() => mockURL);
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      // Mock document.createElement to return a real anchor element
      const mockLink = document.createElement('a');
      const clickSpy = vi.spyOn(mockLink, 'click');
      const createElement = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Mock appendChild and removeChild
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      await service.downloadDocumentAsFile('doc-123', 'test-document.pdf');

      expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe(mockURL);
      expect(mockLink.download).toBe('test-document.pdf');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURL).toHaveBeenCalledWith(mockURL);

      createElement.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
