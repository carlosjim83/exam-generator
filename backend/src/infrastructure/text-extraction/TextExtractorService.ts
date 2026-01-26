import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import { ITextExtractor } from '../../domain/services/ITextExtractor.js';

// pdf-parse uses CommonJS exports, handle both CJS and ESM
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

/**
 * TextExtractorService
 * Infrastructure implementation of ITextExtractor
 * Supports PDF and DOCX file formats
 */
export class TextExtractorService implements ITextExtractor {
  private readonly SUPPORTED_MIMETYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  /**
   * Extract text from PDF buffer
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error: any) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Check if extractor supports a given mime type
   */
  supports(mimeType: string): boolean {
    return this.SUPPORTED_MIMETYPES.includes(mimeType);
  }
}
