import { z } from 'genkit';
import { ai, chunkingConfig, EMBEDDING_MODEL } from '../genkit.config.js';
import { googleAI } from '@genkit-ai/google-genai';
import { chunk } from 'llm-chunk';
import { readFile } from 'fs/promises';
import { indexChunks, ChunkWithEmbedding } from '../indexers/pgvector.indexer.js';
import { TextExtractorService } from '../../text-extraction/TextExtractorService.js';

/**
 * Process Document Flow with Genkit
 *
 * This flow handles the complete RAG pipeline for a document:
 * 1. Extract text from PDF (using TextExtractorService)
 * 2. Chunk the text into semantic pieces
 * 3. Generate embeddings for each chunk using Gemini
 * 4. Store chunks + embeddings in pgvector database
 *
 * Architecture:
 * - Uses Genkit's ai.run() for observability
 * - Uses TextExtractorService for text extraction
 * - Uses llm-chunk for intelligent chunking
 * - Uses Gemini embedding model (768 dimensions)
 * - Stores in PostgreSQL with pgvector
 */

// Instantiate text extractor service
const textExtractor = new TextExtractorService();

/**
 * Extract text from a PDF file
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = await readFile(filePath);
  return await textExtractor.extractFromPDF(dataBuffer);
}

/**
 * Calculate word count from text
 */
function calculateWordCount(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().replace(/\s+/g, ' ').split(' ').length;
}

/**
 * Estimate page count (250 words per page)
 */
function estimatePageCount(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 250));
}

/**
 * Input schema for the process document flow
 */
const ProcessDocumentInputSchema = z.object({
  documentId: z.string().describe('Document ID from database'),
  filePath: z.string().describe('Local file path to the document'),
});

/**
 * Output schema for the process document flow
 */
const ProcessDocumentOutputSchema = z.object({
  success: z.boolean(),
  chunksCreated: z.number(),
  wordCount: z.number(),
  pageCount: z.number(),
  error: z.string().optional(),
});

/**
 * Genkit Flow: Process Document
 *
 * Main entry point for document processing with RAG
 */
export const processDocumentFlow = ai.defineFlow(
  {
    name: 'processDocument',
    inputSchema: ProcessDocumentInputSchema,
    outputSchema: ProcessDocumentOutputSchema,
  },
  async ({ documentId, filePath }) => {
    try {
      // Step 1: Extract text from PDF
      const pdfText = await ai.run('extract-text', () => extractTextFromPdf(filePath));

      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Calculate metadata
      const wordCount = calculateWordCount(pdfText);
      const pageCount = estimatePageCount(wordCount);

      // Step 2: Chunk the text
      const chunks = await ai.run('chunk-text', async () => chunk(pdfText, chunkingConfig));

      if (chunks.length === 0) {
        throw new Error('No chunks were created from the text');
      }

      // Step 3: Generate embeddings for each chunk
      const chunksWithEmbeddings: ChunkWithEmbedding[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];

        // Generate embedding using Gemini
        const embeddingResult = await ai.embed({
          embedder: googleAI.embedder(EMBEDDING_MODEL),
          content: chunkText,
        });

        const embedding = embeddingResult[0].embedding;

        chunksWithEmbeddings.push({
          documentId,
          chunkIndex: i,
          content: chunkText,
          embedding,
          wordCount: calculateWordCount(chunkText),
          pageNumber: undefined, // Could be extracted from PDF metadata if needed
        });
      }

      // Step 4: Index chunks into pgvector database
      await ai.run('index-chunks', async () => {
        await indexChunks(chunksWithEmbeddings);
      });

      return {
        success: true,
        chunksCreated: chunksWithEmbeddings.length,
        wordCount,
        pageCount,
      };
    } catch (error: any) {
      console.error('Error in processDocumentFlow:', error);
      return {
        success: false,
        chunksCreated: 0,
        wordCount: 0,
        pageCount: 0,
        error: error.message || 'Unknown error during document processing',
      };
    }
  }
);
