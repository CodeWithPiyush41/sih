import type { NormalizedPage } from './types';
import type { PageTextResult } from './text-extractor';

/**
 * Deterministically cleans and normalizes extracted text page by page.
 * Strips null bytes, controls characters, normalizes whitespace and newlines.
 */
export function cleanAndNormalizePageText(
  pages: PageTextResult[],
  source: 'text' | 'ocr'
): { normalizedPages: NormalizedPage[]; totalCharacters: number; extractedText: string } {
  let totalCharacters = 0;

  const normalizedPages: NormalizedPage[] = pages.map(({ page, text }) => {
    const cleanedText = cleanPageText(text);
    const charCount = cleanedText.length;
    totalCharacters += charCount;

    return {
      page,
      text: cleanedText,
      source,
      characterCount: charCount,
    };
  });

  const extractedText = normalizedPages.map((p) => `--- PAGE ${p.page} ---\n${p.text}`).join('\n\n');

  return {
    normalizedPages,
    totalCharacters,
    extractedText,
  };
}

/**
 * Cleans a single string representing a page of text.
 */
export function cleanPageText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    // Remove null bytes and invisible control chars (keep \n and \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Normalize Windows/Mac line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace non-breaking spaces and tabs with standard space
    .replace(/[\u00A0\t]/g, ' ')
    // Normalize multiple spaces into single space
    .replace(/ {2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Collapse 3 or more consecutive newlines into double newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
