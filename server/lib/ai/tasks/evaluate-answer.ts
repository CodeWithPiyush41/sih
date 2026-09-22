import { ai } from '../orchestrator/router';
import { AnswerEvaluationSchema, AnswerEvaluation } from '../schemas/evaluation';
import { GeneratedQuestion } from '../schemas/question';

export interface EvaluateAnswerParams {
  question: GeneratedQuestion;
  studentAnswer: string;
}

export async function evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation> {
  const prompt = `Evaluate the student's answer for the following question.

Question:
${params.question.question}

Max Marks:
${params.question.marks}

Student Answer:
${params.studentAnswer}

Provide a score (0 to ${params.question.marks}), constructive feedback, and list any key concepts the student missed.
`;

  const systemInstruction = 'You are a fair and constructive teacher grading a student response.';

  const result = await ai.generateStructured(
    'evaluate-answer',
    { prompt, systemInstruction },
    AnswerEvaluationSchema,
    'EvaluateAnswer',
    'Evaluates a student written answer'
  );

  return result.data;
}
