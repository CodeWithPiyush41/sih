import type { PDFProcessorOutput } from './types';
import { validatePdfBuffer, detectPdfType } from './detector';
import { extractTextFromPdf } from './text-extractor';
import { performOcrOnPdf } from './ocr';
import { cleanAndNormalizePageText } from './cleaner';

/**
 * Executes the complete PDF processing pipeline:
 * Validation -> Text Extraction -> Type Detection -> Optional OCR -> Cleaning & Normalization
 */
export async function processPdfBuffer(buffer: Buffer): Promise<PDFProcessorOutput> {
  // 1. Validation
  const validation = validatePdfBuffer(buffer);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid PDF buffer.');
  }

  // 2. Initial text-based extraction
  let extractionResult = await extractTextFromPdf(buffer);

  // 3. Detect PDF type (text vs scanned)
  let pdfType = detectPdfType(extractionResult.pageCount, extractionResult.totalChars);
  let pageSource: 'text' | 'ocr' = 'text';

  // 4. If scanned (or low density), attempt OCR
  if (pdfType === 'scanned') {
    try {
      const ocrResult = await performOcrOnPdf(buffer);
      if (ocrResult.totalChars > extractionResult.totalChars) {
        extractionResult = ocrResult;
        pageSource = 'ocr';
      }
    } catch (ocrError: any) {
      console.warn('[PDF Processor] OCR fallback warning:', ocrError?.message || ocrError);
      // If OCR fails, continue with text extraction output
    }
  }

  // 5. Clean & Normalize page-by-page
  const { normalizedPages, totalCharacters, extractedText } = cleanAndNormalizePageText(
    extractionResult.pages,
    pageSource
  );

  return {
    type: pdfType,
    pageCount: extractionResult.pageCount,
    pages: normalizedPages,
    totalCharacters,
    extractedText,
  };
}
