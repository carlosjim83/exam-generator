import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Test Database Helper
 * Provides utilities for managing test database state
 */

// Use TEST_DATABASE_URL for tests, fallback to DATABASE_URL
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for tests');
}

// Create a separate Prisma client for tests
export const testDb = new PrismaClient({
  datasourceUrl: testDatabaseUrl,
  log: process.env.DEBUG_TESTS === 'true' ? ['query', 'error'] : ['error'],
});

/**
 * Clean all tables in the database
 * Call this in beforeEach or afterEach to ensure test isolation
 */
export async function cleanDatabase(): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  await testDb.documentChunk.deleteMany({});
  await testDb.document.deleteMany({});
  await testDb.user.deleteMany({});
}

/**
 * Disconnect from database
 * Call this in afterAll to clean up connections
 */
export async function disconnectDatabase(): Promise<void> {
  await testDb.$disconnect();
}

/**
 * Test Fixtures
 * Helper functions to create test data quickly
 */

interface CreateTestUserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'TEACHER' | 'STUDENT';
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB' | 'MICROSOFT';
  providerId?: string | null;
}

export async function createTestUser(options: CreateTestUserOptions = {}) {
  const id = randomUUID();
  return testDb.user.create({
    data: {
      id,
      email: options.email ?? `test-${id}@example.com`,
      password: options.password ?? 'hashed_password_123',
      firstName: options.firstName ?? 'Test',
      lastName: options.lastName ?? 'User',
      role: options.role ?? 'TEACHER',
      provider: options.provider ?? 'LOCAL',
      providerId: options.providerId ?? null,
    },
  });
}

interface CreateTestDocumentOptions {
  userId: string;
  title?: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  blobUrl?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pageCount?: number | null;
  wordCount?: number | null;
  errorMessage?: string | null;
}

export async function createTestDocument(options: CreateTestDocumentOptions) {
  const id = randomUUID();
  return testDb.document.create({
    data: {
      id,
      userId: options.userId,
      title: options.title ?? 'Test Document',
      filename: options.filename ?? 'test.pdf',
      fileSize: options.fileSize ?? 1024,
      mimeType: options.mimeType ?? 'application/pdf',
      blobUrl: options.blobUrl ?? `file://test/${id}.pdf`,
      status: options.status ?? 'PENDING',
      pageCount: options.pageCount ?? null,
      wordCount: options.wordCount ?? null,
      errorMessage: options.errorMessage ?? null,
    },
  });
}

interface CreateTestChunkOptions {
  documentId: string;
  content: string;
  embedding?: number[];
  chunkIndex?: number;
  pageNumber?: number | null;
  wordCount?: number;
}

export async function createTestChunk(options: CreateTestChunkOptions) {
  const id = randomUUID();
  const chunkIndex = options.chunkIndex ?? 0;
  const pageNumber = options.pageNumber ?? null;
  const wordCount = options.wordCount ?? options.content.split(/\s+/).length;

  // Generate random embedding if not provided (1536 dimensions for Azure OpenAI)
  const embedding = options.embedding ?? Array.from({ length: 1536 }, () => Math.random());
  const embeddingString = `[${embedding.join(',')}]`;

  // Use raw SQL because pgvector embedding is Unsupported type in Prisma
  await testDb.$executeRaw`
    INSERT INTO document_chunks (id, document_id, content, embedding, chunk_index, page_number, word_count)
    VALUES (${id}, ${options.documentId}, ${options.content}, ${embeddingString}::vector, ${chunkIndex}, ${pageNumber}, ${wordCount})
  `;

  // Fetch and return the created chunk
  return testDb.documentChunk.findUniqueOrThrow({
    where: { id },
  });
}

/**
 * Execute raw SQL for advanced test setup
 */
export async function executeRawSql(sql: string): Promise<void> {
  await testDb.$executeRawUnsafe(sql);
}
