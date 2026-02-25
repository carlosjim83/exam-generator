import { toSql } from 'pgvector';
import postgres from 'postgres';

import { env } from '@config/env.js';
import { prisma } from '@config/prisma.js';

/**
 * PgVector Indexer for Genkit
 *
 * Stores document chunks with embeddings in PostgreSQL using pgvector extension.
 * This is a custom implementation (not using genkitx-cloud-sql-pg) because we're
 * using standard PostgreSQL, not Google Cloud SQL.
 *
 * Architecture:
 * - Uses Prisma for type-safe database operations
 * - Uses postgres client for raw vector operations
 * - Stores chunks in document_chunks table with HNSW index for fast similarity search
 */

// Initialize postgres client for raw SQL operations (needed for pgvector)
const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export interface ChunkWithEmbedding {
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  pageNumber?: number;
  wordCount: number;
}

/**
 * Index a single chunk with its embedding into the database
 */
export async function indexChunk(chunk: ChunkWithEmbedding): Promise<void> {
  // Use raw SQL for inserting vector data
  // Prisma doesn't support vector types natively yet
  await sql`
    INSERT INTO document_chunks (
      id,
      document_id,
      chunk_index,
      content,
      embedding,
      page_number,
      word_count
    ) VALUES (
      gen_random_uuid(),
      ${chunk.documentId},
      ${chunk.chunkIndex},
      ${chunk.content},
      ${toSql(chunk.embedding)},
      ${chunk.pageNumber ?? null},
      ${chunk.wordCount}
    )
  `;
}

/**
 * Index multiple chunks in a batch (more efficient)
 */
export async function indexChunks(chunks: ChunkWithEmbedding[]): Promise<void> {
  if (chunks.length === 0) return;

  // Batch insert - just insert sequentially
  // PostgreSQL is fast enough for this use case
  for (const chunk of chunks) {
    await sql`
      INSERT INTO document_chunks (
        id,
        document_id,
        chunk_index,
        content,
        embedding,
        page_number,
        word_count
      ) VALUES (
        gen_random_uuid(),
        ${chunk.documentId},
        ${chunk.chunkIndex},
        ${chunk.content},
        ${toSql(chunk.embedding)},
        ${chunk.pageNumber ?? null},
        ${chunk.wordCount}
      )
    `;
  }
}

/**
 * Delete all chunks for a specific document
 * Useful for reprocessing documents
 */
export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  });
}

/**
 * Get chunk count for a document
 */
export async function getChunkCount(documentId: string): Promise<number> {
  return await prisma.documentChunk.count({
    where: { documentId },
  });
}

/**
 * Cleanup function to close postgres connection
 * Should be called on application shutdown
 */
export async function closeIndexer(): Promise<void> {
  await sql.end();
}
