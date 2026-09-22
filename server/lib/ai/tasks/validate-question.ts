import { ai } from '../orchestrator/router';
import { QuestionValidationResponseSchema, QuestionValidationResponse, GeneratedQuestion } from '../schemas/question';

export async function validateQuestion(question: GeneratedQuestion): Promise<QuestionValidationResponse> {
  const prompt = `Validate the following generated question for an educational assessment.
Check for:
- Ambiguous wording
- Missing answer
- Invalid MCQ options (if MCQ)
- Missing topic
- Unsupported question type

Question JSON:
${JSON.stringify(question, null, 2)}
`;

  const systemInstruction = 'You are a strict QA reviewer. If the question has issues, set valid to false and list the issues. Otherwise set valid to true.';

  const result = await ai.generateStructured(
    'validate-question',
    { prompt, systemInstruction },
    QuestionValidationResponseSchema,
    'ValidateQuestion',
    'Validates a question for quality and correctness'
  );

  return result.data;
}
