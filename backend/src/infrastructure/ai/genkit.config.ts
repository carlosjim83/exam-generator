import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { env } from '../../config/env.js';

/**
 * Genkit AI Configuration
 *
 * Centralized configuration for Genkit with Google AI integration.
 * This instance is used across the application for:
 * - Text extraction and processing
 * - Embedding generation
 * - RAG (Retrieval-Augmented Generation)
 * - Exam generation
 *
 * Architecture Decision:
 * - Using Google AI plugin for Gemini models
 * - Custom pgvector integration (not using genkitx-cloud-sql-pg because we're not on GCP)
 * - Embeddings: gemini-embedding-001 (768 dimensions)
 * - Text generation: gemini-2.0-flash-exp
 */

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GEMINI_API_KEY,
    }),
  ],
});

/**
 * Chunking Configuration
 * Used for splitting documents into manageable pieces for embedding
 *
 * Strategy:
 * - Sentence-based splitting for better semantic coherence
 * - Overlap to preserve context between chunks
 * - Size optimized for Gemini embedding model (max 2048 tokens)
 */
export const chunkingConfig = {
  minLength: 500, // Minimum characters per chunk
  maxLength: 1500, // Maximum characters per chunk (roughly 300-400 tokens)
  splitter: 'sentence', // Split by sentences for semantic coherence
  overlap: 100, // Overlap between chunks to preserve context
  delimiters: '', // Use default delimiters
} as const;

/**
 * Embedding Configuration
 */
export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSION = 768;

/**
 * Generation Configuration
 */
export const GENERATION_MODEL = 'gemini-2.0-flash-exp';
