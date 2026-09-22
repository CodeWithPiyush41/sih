import { z } from 'zod';

export const QuestionOptionSchema = z.object({
  text: z.string(),
  is_correct: z.boolean(),
});

export const GeneratedQuestionSchema = z.object({
  question: z.string().describe('The main prompt or question text'),
  question_type: z.enum(['mcq', 'conceptual', 'code_output', 'debugging', 'coding']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string().describe('The topic this question belongs to'),
  marks: z.number().int().min(1),
  options: z.array(QuestionOptionSchema).optional().describe('Options for MCQ questions. Required if question_type is mcq.'),
  explanation: z.string().describe('Explanation of the correct answer'),
  codeTemplate: z.string().optional().describe('Starting code template for coding questions'),
  expectedOutput: z.string().optional().describe('Expected stdout for code output questions'),
});

export const GenerateQuestionsResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

export const QuestionValidationIssueSchema = z.object({
  issue: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
});

export const QuestionValidationResponseSchema = z.object({
  valid: z.boolean(),
  issues: z.array(QuestionValidationIssueSchema).optional(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GenerateQuestionsResponse = z.infer<typeof GenerateQuestionsResponseSchema>;
export type QuestionValidationResponse = z.infer<typeof QuestionValidationResponseSchema>;
