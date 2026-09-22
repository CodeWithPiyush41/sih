export type PDFType = 'text' | 'scanned';

export interface PDFValidationResult {
  isValid: boolean;
  error?: string;
  sizeBytes: number;
}

export interface NormalizedPage {
  page: number;
  text: string;
  source: 'text' | 'ocr';
  characterCount: number;
}

export interface PDFProcessorOutput {
  type: PDFType;
  pageCount: number;
  pages: NormalizedPage[];
  totalCharacters: number;
  extractedText: string;
}
