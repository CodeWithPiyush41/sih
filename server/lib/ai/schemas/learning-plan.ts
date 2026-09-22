import { z } from 'zod';

export const LearningPlanStepSchema = z.object({
  topic: z.string().describe('The topic this step focuses on'),
  concept: z.string().describe('The specific concept to review or practice'),
  activity: z.string().describe('The suggested activity (e.g., Review, Practice, Quiz)'),
  order: z.number().int().describe('The sequence order of this step'),
});

export const LearningPlanSchema = z.object({
  steps: z.array(LearningPlanStepSchema).describe('The ordered steps in the learning plan'),
});

export type LearningPlan = z.infer<typeof LearningPlanSchema>;
