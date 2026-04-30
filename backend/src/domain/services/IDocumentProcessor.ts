/**
 * IDocumentProcessor Interface (Port)
 *
 * Abstraction for document processing pipeline (text extraction, chunking,
 * embedding generation, and vector indexing).
 * Implementation is in the infrastructure layer (e.g., Genkit flow).
 */

export interface ProcessDocumentInput {
  documentId: string;
  filePath: string;
  mimeType: string;
}

export interface ProcessDocumentOutput {
  success: boolean;
  chunksCreated: number;
  pageCount: number;
  wordCount: number;
  error?: string;
}

export interface IDocumentProcessor {
  /**
   * Process a document through the RAG pipeline:
   * extract text, chunk, generate embeddings, index chunks.
   */
  process(input: ProcessDocumentInput): Promise<ProcessDocumentOutput>;

  /**
   * Get the number of indexed chunks for a document.
   */
  getChunkCount(documentId: string): Promise<number>;
}
