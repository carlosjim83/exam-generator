import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';

import type { ITextExtractor } from '../../domain/services/ITextExtractor.js';

import { OCRService } from './OCRService.js';

// pdf-parse uses CommonJS exports, handle both CJS and ESM
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

/**
 * TextExtractorService
 * Infrastructure implementation of ITextExtractor
 * Supports PDF and DOCX file formats with OCR fallback
 */
export class TextExtractorService implements ITextExtractor {
  private readonly SUPPORTED_MIMETYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  private ocrService: OCRService;

  constructor() {
    this.ocrService = new OCRService();
  }

  /**
   * Extract text from PDF buffer
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid PDF buffer provided');
      }

      // Check if buffer starts with PDF magic number
      const pdfHeader = buffer.toString('utf-8', 0, 5);
      if (!pdfHeader.startsWith('%PDF-')) {
        throw new Error(
          'Invalid PDF format: file does not start with %PDF- header. ' +
            `File appears to be: ${pdfHeader}. ` +
            'Make sure you are uploading a valid PDF file.'
        );
      }

      console.log(`Extracting text from PDF (size: ${buffer.length} bytes)...`);

      const data = await pdfParse(buffer, {
        // pdf-parse options
        max: 0, // Parse all pages (0 = no limit)
      });

      // Validate extracted text
      if (!data || typeof data.text !== 'string') {
        throw new Error('PDF parsing returned invalid data structure');
      }

      if (data.text.trim().length === 0) {
        console.warn(
          'PDF parsed successfully but contains no extractable text. This might be a scanned PDF.'
        );
        throw new Error(
          'No text could be extracted from PDF. ' +
            'This might be a scanned/image-based PDF. ' +
            'Please upload a PDF with selectable text or use OCR first.'
        );
      }

      console.log(`Successfully extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error: any) {
      // Provide more detailed error information
      const errorDetails = {
        message: error.message,
        bufferSize: buffer?.length || 0,
        bufferType: typeof buffer,
        isBuffer: Buffer.isBuffer(buffer),
      };

      console.error('PDF extraction failed:', errorDetails);

      // Re-throw with more context if it's our custom error
      if (
        error.message.includes('Invalid PDF format') ||
        error.message.includes('No text could be extracted') ||
        error.message.includes('Empty or invalid')
      ) {
        throw error;
      }

      // Otherwise throw a generic error with the original message
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX buffer
   * Falls back to OCR if the document contains only images
   */
  async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid DOCX buffer provided');
      }

      // Check if buffer starts with DOCX magic number (PK zip header)
      const header = buffer.toString('hex', 0, 4);
      if (header !== '504b0304') {
        throw new Error(
          'Invalid DOCX format: file does not start with ZIP header (PK). ' +
            `File header: ${header}. ` +
            'Make sure you are uploading a valid DOCX file.'
        );
      }

      console.log(`Extracting text from DOCX (size: ${buffer.length} bytes)...`);

      // Try extracting text with mammoth first
      const result = await mammoth.extractRawText({ buffer });

      // Validate extracted text
      if (!result || typeof result.value !== 'string') {
        throw new Error('DOCX parsing returned invalid data structure');
      }

      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages);
      }

      // Check if text was successfully extracted
      const extractedText = result.value.trim();

      if (extractedText.length > 50) {
        // Text successfully extracted
        console.log(`Successfully extracted ${result.value.length} characters from DOCX`);
        return result.value;
      }

      // No meaningful text found - try OCR on images
      console.warn('DOCX contains little or no extractable text. Attempting OCR...');

      const ocrText = await this.extractTextFromDOCXImages(buffer);

      if (ocrText.trim().length === 0) {
        throw new Error(
          'No text could be extracted from DOCX using text extraction or OCR. ' +
            'The document might be completely empty or corrupted.'
        );
      }

      console.log(`Successfully extracted ${ocrText.length} characters from DOCX using OCR`);
      return ocrText;
    } catch (error: any) {
      // Provide more detailed error information
      const errorDetails = {
        message: error.message,
        bufferSize: buffer?.length || 0,
        bufferType: typeof buffer,
        isBuffer: Buffer.isBuffer(buffer),
      };

      console.error('DOCX extraction failed:', errorDetails);

      // Re-throw with more context if it's our custom error
      if (
        error.message.includes('Invalid DOCX format') ||
        error.message.includes('No text could be extracted') ||
        error.message.includes('Empty or invalid')
      ) {
        throw error;
      }

      // Otherwise throw a generic error with the original message
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Extract images from DOCX and apply OCR
   * @param buffer - DOCX file buffer
   * @returns Text extracted from images via OCR
   */
  private async extractTextFromDOCXImages(buffer: Buffer): Promise<string> {
    try {
      console.log('[DOCX OCR] Extracting images from DOCX...');

      // Load DOCX as ZIP
      const zip = await JSZip.loadAsync(buffer);

      // Find all images in word/media folder
      const imageFiles = Object.keys(zip.files).filter(
        (filename) =>
          filename.startsWith('word/media/') &&
          (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg'))
      );

      if (imageFiles.length === 0) {
        console.warn('[DOCX OCR] No images found in DOCX');
        return '';
      }

      console.log(`[DOCX OCR] Found ${imageFiles.length} images in DOCX`);

      // Extract image buffers
      const imageBuffers: Buffer[] = [];
      for (const filename of imageFiles) {
        const file = zip.files[filename];
        const arrayBuffer = await file.async('arraybuffer');
        imageBuffers.push(Buffer.from(arrayBuffer));
      }

      // Apply OCR to all images
      const text = await this.ocrService.extractTextFromImages(imageBuffers);

      return text;
    } catch (error: any) {
      console.error('[DOCX OCR] Failed to extract text from images:', error);
      throw new Error(`Failed to extract images from DOCX for OCR: ${error.message}`);
    }
  }

  /**
   * Check if extractor supports a given mime type
   */
  supports(mimeType: string): boolean {
    return this.SUPPORTED_MIMETYPES.includes(mimeType);
  }
}
