/**
 * ITextExtractor Interface (Port)
 * Defines text extraction operations for different file types
 * Implementation is in infrastructure layer
 */
export interface ITextExtractor {
  /**
   * Extract text from a PDF buffer
   * @param buffer - PDF file buffer
   * @returns Extracted text
   */
  extractFromPDF(buffer: Buffer): Promise<string>;

  /**
   * Extract text from a DOCX buffer
   * @param buffer - DOCX file buffer
   * @returns Extracted text
   */
  extractFromDOCX(buffer: Buffer): Promise<string>;

  /**
   * Check if extractor supports a given mime type
   * @param mimeType - File mime type
   */
  supports(mimeType: string): boolean;
}
