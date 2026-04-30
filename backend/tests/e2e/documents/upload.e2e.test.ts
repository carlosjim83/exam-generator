import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { createTestServer } from '@tests/helpers/test-server.js';
import { UserMother } from '@tests/helpers/mothers/index.js';
import { container } from '@config/container.js';
import { IStorageService } from '@domain/services/IStorageService.js';

describe('Document Upload Route', () => {
  let server: FastifyInstance;
  let authToken: string;
  let storageService: IStorageService;

  beforeAll(async () => {
    server = await createTestServer();

    // Get storage service from container
    storageService = container.storageService;

    // Create user via UserMother
    const { tokens } = await UserMother.teacher(server);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    await server.close();
    container.cleanup();
  });

  it('should return 400 if no file is provided', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/documents/upload',
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
