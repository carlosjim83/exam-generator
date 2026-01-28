import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { createTestServer } from '@tests/helpers/test-server.js';
import { container } from '@config/container.js';
import { IStorageService } from '@domain/services/IStorageService.js';

describe('Document Upload Route', () => {
  let server: FastifyInstance;
  let authToken: string;
  let storageService: IStorageService;

  beforeAll(async () => {
    // Using a (yet to be created) helper to build the server with DI container
    server = await createTestServer();

    // Get services from the container
    const registerUseCase = container.registerUserUseCase;
    const loginUseCase = container.loginUserUseCase;
    storageService = container.storageService;

    // Create user and get token
    const userEmail = `upload-test-${Date.now()}@example.com`;
    await registerUseCase.execute({
      firstName: 'Upload',
      lastName: 'User',
      email: userEmail,
      password: 'Password123!',
      role: 'TEACHER',
    });

    const { tokens } = await loginUseCase.execute({ email: userEmail, password: 'Password123!' });
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    await server.close();
    container.cleanup();
  });

  it('should upload a document and store it using the StorageService', async () => {
    // Spy on the storage service to ensure it's called without writing to disk
    const storageSpy = vi
      .spyOn(storageService, 'upload')
      .mockResolvedValue('http://localhost:9000/uploads/mock-path.pdf');

    const form = new FormData();
    const fileContent = 'this is a fake pdf for my test';
    const fileName = 'test-document.pdf';

    form.append('file', Buffer.from(fileContent), {
      filename: fileName,
      contentType: 'application/pdf',
    });

    const response = await server.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: {
        ...form.getHeaders(),
        authorization: `Bearer ${authToken}`,
      },
      payload: form,
    });

    // --- Assertions ---

    // 1. HTTP Response is correct
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('uploaded successfully');

    // 2. The document metadata in the response is correct
    expect(body.document.id).toBeDefined();
    expect(body.document.filename).toBe(fileName);
    expect(body.document.status).toBe('PENDING'); // Documents start as PENDING until processed

    // 3. Storage service was called correctly
    expect(storageSpy).toHaveBeenCalledOnce();
    const [uploadedFileName, uploadedBuffer] = storageSpy.mock.calls[0];
    expect(uploadedFileName).toContain(fileName.split('.')[0]); // Service might add timestamp
    expect(uploadedBuffer.toString()).toBe(fileContent);

    // Restore the mock
    storageSpy.mockRestore();
  });

  it('should return 400 if no file is provided', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: {
        authorization: `Bearer ${authToken}`,
        'content-type': 'multipart/form-data; boundary=---XXX', // Must provide boundary
      },
      payload: '---XXX\r\nContent-Disposition: form-data; name="field"\r\n\r\nvalue\r\n---XXX--',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('No file uploaded');
  });
});
