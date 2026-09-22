import { ai } from '../orchestrator/router';
import { GenerateQuestionsResponseSchema, GenerateQuestionsResponse } from '../schemas/question';

export interface GenerateQuestionsParams {
  materialContext: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<GenerateQuestionsResponse> {
  const prompt = `Generate ${params.count} questions based on the following context.
The questions should cover these topics: ${params.topics.join(', ')}.
The overall difficulty level should be ${params.difficulty}.

For NORMAL (easy) difficulty: focus on MCQ, conceptual, and short answer.
For MEDIUM difficulty: focus on MCQ, application, code output, debugging.
For HARD difficulty: focus on coding, debugging, and implementation.

Make sure to provide correct answers and explanations.

Context:
${params.materialContext.substring(0, 15000)}
`;

  const systemInstruction = 'You are an expert assessment creator. Generate valid JSON containing an array of questions. Ensure they match the requested difficulty and topics.';

  const result = await ai.generateStructured(
    'generate-questions',
    { prompt, systemInstruction },
    GenerateQuestionsResponseSchema,
    'GenerateQuestions',
    'Generates questions for an assessment'
  );

  return result.data;
}
