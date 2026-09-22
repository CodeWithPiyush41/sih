import type { PageTextResult, ExtractedPdfResult } from './text-extractor';

const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';

export async function performOcrOnPdf(buffer: Buffer): Promise<ExtractedPdfResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  
  if (!apiKey) {
    throw new Error('OCR.space API key is not configured in server environment.');
  }

  // Convert buffer to base64 data URI format for OCR.space POST payload
  const base64Pdf = `data:application/pdf;base64,${buffer.toString('base64')}`;

  const formData = new URLSearchParams();
  formData.append('apikey', apiKey);
  formData.append('base64Image', base64Pdf);
  formData.append('language', 'eng');
  formData.append('filetype', 'PDF');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  const response = await fetch(OCR_SPACE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR.space request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    const errorMessage = Array.isArray(data.ErrorMessage) 
      ? data.ErrorMessage.join('; ') 
      : (data.ErrorMessage || 'Unknown OCR processing error');
    throw new Error(`OCR.space processing failed: ${errorMessage}`);
  }

  const parsedResults = data.ParsedResults || [];
  const pages: PageTextResult[] = [];
  let totalChars = 0;

  parsedResults.forEach((result: any, index: number) => {
    const pageText = result.ParsedText || '';
    pages.push({
      page: index + 1,
      text: pageText,
    });
    totalChars += pageText.length;
  });

  return {
    pageCount: pages.length,
    pages,
    totalChars,
  };
}
