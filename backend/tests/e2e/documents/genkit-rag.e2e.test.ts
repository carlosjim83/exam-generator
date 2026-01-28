/**
 * Document Processing with Genkit Integration Tests
 * Tests for POST /documents/:id/process endpoint with RAG/Embeddings
 *
 * Covers:
 * - PDF text extraction with pdf-parse
 * - Text chunking with llm-chunk
 * - Embedding generation with Gemini
 * - Chunks stored in pgvector database
 * - Status transitions (PENDING → PROCESSING → COMPLETED)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestServer } from '@tests/helpers/test-server.js';
import { container } from '@config/container.js';
import { prisma } from '@config/prisma.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to generate unique email for each test
 */
function uniqueEmail(prefix: string = 'genkit-test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

describe('Document Processing with Genkit (RAG/Embeddings)', () => {
  let server: FastifyInstance;
  let authToken: string;
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    server = await createTestServer();

    // Create user and get token
    const userEmail = uniqueEmail('doc-genkit');
    await container.registerUserUseCase.execute({
      firstName: 'Genkit',
      lastName: 'Test',
      email: userEmail,
      password: 'GenkitPass123!',
      role: 'TEACHER',
    });

    const { tokens, user } = await container.loginUserUseCase.execute({
      email: userEmail,
      password: 'GenkitPass123!',
    });
    authToken = tokens.accessToken;
    userId = user.id;

    // Upload a test document (simple PDF for testing)
    // We'll create a minimal PDF buffer for testing
    const testPdfBuffer = await createMinimalPdfBuffer();

    // Mock storage service to return a fake URL
    const storageSpy = vi
      .spyOn(container.storageService, 'upload')
      .mockResolvedValue('file://./uploads/test-genkit-doc.pdf');

    // Save the buffer to a temp file so the processor can read it
    const tempFilePath = path.join(process.cwd(), 'uploads', 'test-genkit-doc.pdf');
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, testPdfBuffer);

    // Upload document via API
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', testPdfBuffer, {
      filename: 'test-document.pdf',
      contentType: 'application/pdf',
    });

    const uploadResponse = await server.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: {
        ...form.getHeaders(),
        authorization: `Bearer ${authToken}`,
      },
      payload: form,
    });

    expect(uploadResponse.statusCode).toBe(201);
    const uploadBody = JSON.parse(uploadResponse.body);
    documentId = uploadBody.document.id;

    storageSpy.mockRestore();
  });

  afterAll(async () => {
    // Cleanup test file
    const tempFilePath = path.join(process.cwd(), 'uploads', 'test-genkit-doc.pdf');
    await fs.unlink(tempFilePath).catch(() => {});

    await server.close();
    container.cleanup();
  });

  it('should process document and create embeddings with Genkit', async () => {
    // Mock the Genkit embedding call to avoid real API calls in tests
    // We'll mock at the ai.embed level
    const mockEmbedding = new Array(768).fill(0).map(() => Math.random());

    // TODO: This will need actual mocking of Genkit's embed function
    // For now, we'll skip this test if GEMINI_API_KEY is not set
    if (process.env.GEMINI_API_KEY === 'placeholder') {
      console.log('⚠️  Skipping Genkit test - GEMINI_API_KEY not configured');
      return;
    }

    // Process the document
    const response = await server.inject({
      method: 'POST',
      url: `/documents/${documentId}/process`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    // Should succeed
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.document.status).toBe('COMPLETED');
    expect(body.document.wordCount).toBeGreaterThan(0);
    expect(body.document.pageCount).toBeGreaterThanOrEqual(1);

    // Verify chunks were created in database
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
    });

    expect(chunks.length).toBeGreaterThan(0);

    // Verify first chunk has content and embedding
    expect(chunks[0].content).toBeTruthy();
    expect(chunks[0].content.length).toBeGreaterThan(0);
    expect(chunks[0].embedding).toBeTruthy(); // pgvector field
    expect(chunks[0].wordCount).toBeGreaterThan(0);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('should return 404 for non-existent document', async () => {
    // Use a valid UUIDv4 format that doesn't exist in database
    const fakeId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    const response = await server.inject({
      method: 'POST',
      url: `/documents/${fakeId}/process`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    if (response.statusCode !== 404) {
      console.error('Expected 404 but got:', response.statusCode);
      console.error('Response body:', JSON.parse(response.body));
    }

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 when trying to process another user's document", async () => {
    // Create another user
    const otherUserEmail = uniqueEmail('other-genkit');
    await container.registerUserUseCase.execute({
      firstName: 'Other',
      lastName: 'User',
      email: otherUserEmail,
      password: 'OtherPass123!',
      role: 'TEACHER',
    });

    const { tokens: otherTokens, user: otherUser } = await container.loginUserUseCase.execute({
      email: otherUserEmail,
      password: 'OtherPass123!',
    });

    // Create document for other user
    const otherDoc = await prisma.document.create({
      data: {
        userId: otherUser.id,
        title: 'Other User Doc',
        filename: 'other.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        blobUrl: 'file://./uploads/other.pdf',
        status: 'PENDING',
      },
    });

    // Try to process with original user's token
    const response = await server.inject({
      method: 'POST',
      url: `/documents/${otherDoc.id}/process`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});

/**
 * Helper function to create a minimal valid PDF buffer
 * This is a very simple PDF with just "Hello World" text
 */
async function createMinimalPdfBuffer(): Promise<Buffer> {
  // Minimal PDF structure (PDF 1.4)
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World from PDF) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000355 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
438
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}
