import Tesseract from 'tesseract.js';

/**
 * OCRService
 *
 * Service for extracting text from images using Tesseract.js OCR
 * Used for scanned PDFs and image-based DOCX files
 */
export class OCRService {
  /**
   * Extract text from an image buffer using OCR
   * @param imageBuffer - Buffer containing the image data (PNG, JPEG, etc.)
   * @param language - Language for OCR (default: 'eng' for English)
   * @returns Extracted text
   */
  async extractTextFromImage(imageBuffer: Buffer, language = 'eng'): Promise<string> {
    try {
      console.log(
        `[OCR] Starting OCR extraction (language: ${language}, size: ${imageBuffer.length} bytes)...`
      );

      const startTime = Date.now();

      // Create Tesseract worker
      const worker = await Tesseract.createWorker(language, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            if (progress % 20 === 0) {
              console.log(`[OCR] Progress: ${progress}%`);
            }
          }
        },
      });

      // Recognize text from image
      const { data } = await worker.recognize(imageBuffer);

      await worker.terminate();

      const duration = Date.now() - startTime;
      console.log(`[OCR] Extraction completed in ${duration}ms`);
      console.log(
        `[OCR] Extracted ${data.text.length} characters (confidence: ${data.confidence.toFixed(2)}%)`
      );

      return data.text;
    } catch (error: any) {
      console.error('[OCR] Extraction failed:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text from multiple images and combine them
   * @param imageBuffers - Array of image buffers
   * @param language - Language for OCR (default: 'eng')
   * @returns Combined text from all images
   */
  async extractTextFromImages(imageBuffers: Buffer[], language = 'eng'): Promise<string> {
    console.log(`[OCR] Starting batch OCR for ${imageBuffers.length} images...`);

    const results: string[] = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`[OCR] Processing image ${i + 1}/${imageBuffers.length}...`);

      try {
        const text = await this.extractTextFromImage(imageBuffers[i], language);
        results.push(text);
      } catch (error: any) {
        console.warn(`[OCR] Failed to extract text from image ${i + 1}: ${error.message}`);
        // Continue with other images even if one fails
        results.push('');
      }
    }

    // Combine all text with page separators
    const combinedText = results.map((text, i) => `\n--- Page ${i + 1} ---\n${text}`).join('\n\n');

    console.log(`[OCR] Batch extraction completed. Total characters: ${combinedText.length}`);

    return combinedText;
  }
}
