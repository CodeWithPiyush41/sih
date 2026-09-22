import { z } from 'zod';

export const AnswerEvaluationSchema = z.object({
  score: z.number().describe('The score awarded to the student (0 to max_score)'),
  max_score: z.number().describe('The maximum possible score for this question'),
  feedback: z.string().describe('Constructive feedback for the student explaining the evaluation'),
  key_concepts_missing: z.array(z.string()).describe('List of important concepts the student missed in their answer'),
});

export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
