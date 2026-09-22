import type { RawChunkInput } from './types';
import type { PDFProcessorOutput, NormalizedPage } from '../pdf/types';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_CHUNK_OVERLAP = 200;

export function getChunkConfig(): { chunkSize: number; chunkOverlap: number } {
  const sizeEnv = process.env.RAG_CHUNK_SIZE;
  const overlapEnv = process.env.RAG_CHUNK_OVERLAP;

  const chunkSize = sizeEnv ? parseInt(sizeEnv, 10) : DEFAULT_CHUNK_SIZE;
  const chunkOverlap = overlapEnv ? parseInt(overlapEnv, 10) : DEFAULT_CHUNK_OVERLAP;

  return {
    chunkSize: !isNaN(chunkSize) && chunkSize > 200 ? chunkSize : DEFAULT_CHUNK_SIZE,
    chunkOverlap: !isNaN(chunkOverlap) && chunkOverlap >= 0 ? chunkOverlap : DEFAULT_CHUNK_OVERLAP,
  };
}

/**
 * Deterministically splits extracted PDF pages into page-aware chunks.
 * Preserves pageStart and pageEnd boundaries without using LLMs.
 */
export function chunkExtractedPdf(
  pdfData: PDFProcessorOutput,
  options?: ChunkingOptions
): RawChunkInput[] {
  const { chunkSize, chunkOverlap } = { ...getChunkConfig(), ...options };
  const pages: NormalizedPage[] = pdfData.pages || [];

  if (pages.length === 0 && pdfData.extractedText) {
    // Single page fallback if pages array is empty
    return [
      {
        chunkIndex: 0,
        pageStart: 1,
        pageEnd: 1,
        content: pdfData.extractedText.slice(0, chunkSize),
        contentLength: Math.min(pdfData.extractedText.length, chunkSize),
      },
    ];
  }

  const chunks: RawChunkInput[] = [];
  let chunkIndex = 0;
  let currentText = '';
  let currentPageStart = 1;
  let currentPageEnd = 1;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = page.page;
    const pageText = page.text ? page.text.trim() : '';

    if (!pageText) continue;

    // Split page text into natural paragraphs/blocks
    const blocks = pageText.split(/\n{2,}/);

    for (const block of blocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) continue;

      if (currentText.length === 0) {
        currentPageStart = pageNum;
        currentPageEnd = pageNum;
      }

      // Check if adding this block exceeds chunkSize
      if (currentText.length + trimmedBlock.length + 1 > chunkSize && currentText.length > 0) {
        // Emit current chunk
        chunks.push({
          chunkIndex: chunkIndex++,
          pageStart: currentPageStart,
          pageEnd: currentPageEnd,
          content: currentText.trim(),
          contentLength: currentText.trim().length,
        });

        // Compute overlap from end of current text
        const overlapText = currentText.length > chunkOverlap 
          ? currentText.slice(-chunkOverlap) 
          : currentText;

        currentText = overlapText + '\n' + trimmedBlock;
        currentPageStart = currentPageEnd; // Retain transition page
        currentPageEnd = pageNum;
      } else {
        currentText += (currentText.length > 0 ? '\n\n' : '') + trimmedBlock;
        currentPageEnd = pageNum;
      }
    }
  }

  // Push remaining accumulated text as final chunk
  if (currentText.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIndex++,
      pageStart: currentPageStart,
      pageEnd: currentPageEnd,
      content: currentText.trim(),
      contentLength: currentText.trim().length,
    });
  }

  return chunks;
}
