import type { PDFValidationResult, PDFType } from './types';

const DEFAULT_MAX_SIZE_MB = 20;

export function getMaxPdfSizeMb(): number {
  const envLimit = process.env.MAX_PDF_SIZE_MB;
  if (envLimit) {
    const parsed = parseInt(envLimit, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_MAX_SIZE_MB;
}

/**
 * Validates PDF buffer magic bytes (%PDF-), size limit, and uncorrupted structure.
 */
export function validatePdfBuffer(buffer: Buffer): PDFValidationResult {
  const maxMb = getMaxPdfSizeMb();
  const maxBytes = maxMb * 1024 * 1024;

  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Uploaded PDF file is empty (0 bytes).', sizeBytes: 0 };
  }

  if (buffer.length > maxBytes) {
    return {
      isValid: false,
      error: `PDF file size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxMb}MB.`,
      sizeBytes: buffer.length,
    };
  }

  // Check magic bytes %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    return {
      isValid: false,
      error: 'File does not contain valid PDF header magic bytes.',
      sizeBytes: buffer.length,
    };
  }

  return { isValid: true, sizeBytes: buffer.length };
}

/**
 * Determines whether extracted text density indicates a text-based PDF or scanned PDF.
 * If average text character count per page < 40 chars, classifies as 'scanned'.
 */
export function detectPdfType(pageCount: number, totalChars: number): PDFType {
  if (pageCount === 0) return 'scanned';
  const avgCharsPerPage = totalChars / pageCount;
  return avgCharsPerPage >= 40 ? 'text' : 'scanned';
}
