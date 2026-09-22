import { ai } from '../orchestrator/router';
import { z } from 'zod';

export const CodeAnalysisSchema = z.object({
  issues: z.array(z.string()).describe('List of potential issues or compile errors'),
  feedback: z.string().describe('Constructive feedback for the student code'),
});

export async function analyzeCode(code: string, questionPrompt: string) {
  const prompt = `Analyze this code submitted by a student.
  
Question:
${questionPrompt}

Student Code:
${code}
`;

  const systemInstruction = 'You are a helpful programming tutor. Identify bugs and provide constructive feedback.';

  const result = await ai.generateStructured(
    'analyze-code',
    { prompt, systemInstruction },
    CodeAnalysisSchema,
    'CodeAnalysis'
  );

  return result.data;
}
