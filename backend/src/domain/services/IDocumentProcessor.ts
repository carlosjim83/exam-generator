import { Document } from '../entities/Document';

/**
 * Document Processing Result
 * Contains extracted metadata from document processing
 */
export interface DocumentProcessingResult {
  extractedText: string;
  wordCount: number;
  pageCount: number;
  processingTimeMs: number;
}

/**
 * IDocumentProcessor Interface (Port)
 * Defines document processing operations
 * Implementation is in infrastructure layer
 * 
 * This service orchestrates:
 * - Text extraction from PDF/DOCX
 * - Metadata calculation (word count, page count)
 * - Processing metrics tracking
 */
export interface IDocumentProcessor {
  /**
   * Process a document by extracting text and calculating metadata
   * 
   * @param document - Document entity to process
   * @param fileBuffer - Raw file buffer from storage
   * @returns Processing result with extracted text and metadata
   * @throws Error if processing fails
   */
  process(document: Document, fileBuffer: Buffer): Promise<DocumentProcessingResult>;
}
