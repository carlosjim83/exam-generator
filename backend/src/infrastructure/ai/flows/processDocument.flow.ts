import { z } from 'genkit';
import { ai, chunkingConfig } from '../genkit.config.js';
import { chunk } from 'llm-chunk';
import { readFile } from 'fs/promises';
import { indexChunks, ChunkWithEmbedding } from '../indexers/pgvector.indexer.js';
import { TextExtractorService } from '../../text-extraction/TextExtractorService.js';
import { AzureOpenAIEmbeddingService } from '../AzureOpenAIEmbeddingService.js';

/**
 * Process Document Flow with Genkit + Azure OpenAI
 *
 * This flow handles the complete RAG pipeline for a document:
 * 1. Extract text from PDF (using TextExtractorService)
 * 2. Chunk the text into semantic pieces
 * 3. Generate embeddings for each chunk using Azure OpenAI
 * 4. Store chunks + embeddings in pgvector database
 *
 * Architecture:
 * - Uses Genkit's ai.run() for observability
 * - Uses TextExtractorService for text extraction
 * - Uses llm-chunk for intelligent chunking
 * - Uses Azure OpenAI embedding model (1536 dimensions)
 * - Stores in PostgreSQL with pgvector
 */

// Instantiate services
const textExtractor = new TextExtractorService();
const embeddingService = new AzureOpenAIEmbeddingService();

/**
 * Extract text from a document file (PDF or DOCX)
 */
async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  const dataBuffer = await readFile(filePath);

  if (mimeType === 'application/pdf') {
    return await textExtractor.extractFromPDF(dataBuffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await textExtractor.extractFromDOCX(dataBuffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
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
  mimeType: z
    .string()
    .describe(
      'MIME type of the document (application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document)'
    ),
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
  async ({ documentId, filePath, mimeType }) => {
    try {
      console.log(`[processDocumentFlow] Starting document processing:`, {
        documentId,
        filePath,
        mimeType,
      });

      // Step 1: Extract text from document (PDF or DOCX)
      const documentText = await ai.run('extract-text', () =>
        extractTextFromDocument(filePath, mimeType)
      );

      console.log(`[processDocumentFlow] Text extracted:`, {
        documentId,
        textLength: documentText.length,
        textPreview: documentText.substring(0, 200) + '...',
      });

      if (!documentText || documentText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      // Calculate metadata
      const wordCount = calculateWordCount(documentText);
      const pageCount = estimatePageCount(wordCount);

      console.log(`[processDocumentFlow] Document metadata:`, {
        documentId,
        wordCount,
        pageCount,
      });

      // Step 2: Chunk the text
      const chunks = await ai.run('chunk-text', async () => chunk(documentText, chunkingConfig));

      console.log(`[processDocumentFlow] Text chunked:`, {
        documentId,
        chunksCount: chunks.length,
        firstChunkPreview: chunks[0]?.substring(0, 100) + '...',
      });

      if (chunks.length === 0) {
        throw new Error('No chunks were created from the text');
      }

      // Step 3: Generate embeddings for all chunks (process individually to avoid rate limits)
      // Process each chunk separately instead of batching to prevent 429 errors
      const embeddings: any[][] = await Promise.all(
        chunks.map((chunkText) =>
          ai.run('generate-embeddings', async () => {
            return await embeddingService.generateEmbeddings([chunkText]);
          })
        )
      );

      console.log(`[processDocumentFlow] Embeddings generated:`, {
        documentId,
        embeddingsCount: embeddings.length,
      });

      // Step 4: Combine chunks with their embeddings
      const chunksWithEmbeddings: ChunkWithEmbedding[] = chunks.map((chunkText, i) => ({
        documentId,
        chunkIndex: i,
        content: chunkText,
        embedding: embeddings[i][0], // Extract first element since we're sending single chunks
        wordCount: calculateWordCount(chunkText),
        pageNumber: undefined, // Could be extracted from PDF metadata if needed
      }));

      // Step 5: Index chunks into pgvector database
      await ai.run('index-chunks', async () => {
        await indexChunks(chunksWithEmbeddings);
      });

      console.log(`[processDocumentFlow] Processing completed successfully:`, {
        documentId,
        chunksCreated: chunksWithEmbeddings.length,
        wordCount,
        pageCount,
      });

      return {
        success: true,
        chunksCreated: chunksWithEmbeddings.length,
        wordCount,
        pageCount,
      };
    } catch (error: any) {
      console.error('[processDocumentFlow] Error:', {
        documentId,
        error: error.message,
        stack: error.stack,
      });
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
