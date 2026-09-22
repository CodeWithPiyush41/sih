import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export interface PageTextResult {
  page: number;
  text: string;
}

export interface ExtractedPdfResult {
  pageCount: number;
  pages: PageTextResult[];
  totalChars: number;
}

/**
 * Extracts page-by-page text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedPdfResult> {
  const pages: PageTextResult[] = [];
  let totalChars = 0;
  let pageCount = 0;

  try {
    if (typeof pdfParseModule === 'function') {
      const pagesMap = new Map<number, string>();
      function customPageRender(pageData: any) {
        return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
          .then((textContent: any) => {
            let text = '';
            let lastY: number | undefined;
            for (const item of textContent.items) {
              if (!item.str) continue;
              if (lastY === undefined || Math.abs(lastY - item.transform[5]) < 2) {
                text += (text.length > 0 && !text.endsWith(' ') ? ' ' : '') + item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pagesMap.set(pageData.pageIndex + 1, text);
            return text;
          });
      }

      const pdfData = await pdfParseModule(buffer, { pagerender: customPageRender });
      pageCount = pdfData.numpages || pagesMap.size;
      for (let pageNum = 1; pageNum <= Math.max(1, pageCount); pageNum++) {
        const text = pagesMap.get(pageNum) || pdfData.text || '';
        pages.push({ page: pageNum, text });
        totalChars += text.length;
      }
    } else if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      pageCount = result.total || result.pages?.length || 1;

      if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
        for (const p of result.pages) {
          const pageNum = p.num || (pages.length + 1);
          const pageText = p.text || '';
          pages.push({ page: pageNum, text: pageText });
          totalChars += pageText.length;
        }
      } else {
        const text = result.text || '';
        pages.push({ page: 1, text });
        totalChars = text.length;
      }
    }
  } catch (err: any) {
    console.warn('[extractTextFromPdf] Primary extraction warning, using fallback text parsing:', err?.message || err);
    const rawString = buffer.toString('utf-8');
    const textMatches = rawString.match(/\(([^()]+)\)\s*Tj/g);
    if (textMatches) {
      const extracted = textMatches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ');
      pages.push({ page: 1, text: extracted });
      totalChars = extracted.length;
      pageCount = 1;
    }
  }

  if (pages.length === 0) {
    pages.push({ page: 1, text: '' });
  }

  return {
    pageCount: Math.max(1, pageCount),
    pages,
    totalChars,
  };
}
