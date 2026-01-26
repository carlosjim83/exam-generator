import { IDocumentProcessor, DocumentProcessingResult } from '../../domain/services/IDocumentProcessor.js';
import { ITextExtractor } from '../../domain/services/ITextExtractor.js';
import { Document } from '../../domain/entities/Document.js';

/**
 * DocumentProcessorService
 * Infrastructure implementation of IDocumentProcessor
 * 
 * Orchestrates:
 * - Text extraction via ITextExtractor
 * - Word count calculation
 * - Page count estimation
 * - Processing time tracking
 */
export class DocumentProcessorService implements IDocumentProcessor {
  constructor(private readonly textExtractor: ITextExtractor) {}

  async process(
    document: Document,
    fileBuffer: Buffer
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Extract text based on mime type
      let extractedText: string;

      if (document.isPDF()) {
        extractedText = await this.textExtractor.extractFromPDF(fileBuffer);
      } else if (document.isDOCX()) {
        extractedText = await this.textExtractor.extractFromDOCX(fileBuffer);
      } else {
        throw new Error(`Unsupported document type: ${document.mimeType}`);
      }

      // 2. Calculate word count
      const wordCount = this.calculateWordCount(extractedText);

      // 3. Estimate page count (roughly 250 words per page)
      const pageCount = Math.max(1, Math.ceil(wordCount / 250));

      // 4. Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      return {
        extractedText,
        wordCount,
        pageCount,
        processingTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Document processing failed: ${errorMessage}`);
    }
  }

  /**
   * Calculate word count from text
   * Removes extra whitespace and counts words
   */
  private calculateWordCount(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Remove extra whitespace and split by spaces
    const words = text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .filter((word) => word.length > 0);

    return words.length;
  }
}
