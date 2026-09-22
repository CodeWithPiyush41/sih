import { ai } from '../orchestrator/router';
import { z } from 'zod';

export const PdfAnalysisSchema = z.object({
  title: z.string().describe('The main title of the document'),
  summary: z.string().describe('A brief summary of the document'),
  topics: z.array(z.string()).describe('High level topics covered'),
});

export async function analyzePDF(textContext: string) {
  const prompt = `Analyze this document and extract its title, a short summary, and a list of high-level topics.
  
Text:
${textContext.substring(0, 15000)}
`;

  const systemInstruction = 'You are an AI assistant that analyzes educational PDFs.';

  const result = await ai.generateStructured(
    'analyze-pdf',
    { prompt, systemInstruction },
    PdfAnalysisSchema,
    'PdfAnalysis'
  );

  return result.data;
}
