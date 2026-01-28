import { genkit } from 'genkit';

/**
 * Genkit AI Configuration
 *
 * Centralized configuration for Genkit AI.
 * This instance is used across the application for:
 * - Observability and tracing
 * - RAG (Retrieval-Augmented Generation) flows
 * - Exam generation (future)
 *
 * Architecture Decision:
 * - Embeddings: Azure OpenAI text-embedding-ada-002 (1536 dimensions)
 * - Text generation: To be determined (Azure OpenAI or other)
 * - Vector storage: Custom pgvector integration
 */

export const ai = genkit({
  plugins: [],
});

/**
 * Chunking Configuration
 * Used for splitting documents into manageable pieces for embedding
 *
 * Strategy:
 * - Sentence-based splitting for better semantic coherence
 * - Overlap to preserve context between chunks
 * - Size optimized for Azure OpenAI embedding model (max 8191 tokens)
 */
export const chunkingConfig = {
  minLength: 500, // Minimum characters per chunk
  maxLength: 1500, // Maximum characters per chunk (roughly 300-400 tokens)
  splitter: 'sentence', // Split by sentences for semantic coherence
  overlap: 100, // Overlap between chunks to preserve context
  delimiters: '', // Use default delimiters
} as const;

/**
 * Embedding Configuration (Azure OpenAI)
 */
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const EMBEDDING_DIMENSION = 1536; // Azure OpenAI text-embedding-ada-002
