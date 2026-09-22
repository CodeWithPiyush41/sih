import { ai } from '../orchestrator/router';
import { LearningPlanSchema, LearningPlan } from '../schemas/learning-plan';

export interface CreateLearningPlanParams {
  topicScores: { topic: string; scorePercent: number }[];
  assessmentHistory: { date: string; title: string; score: number }[];
}

export async function createLearningPlan(params: CreateLearningPlanParams): Promise<LearningPlan> {
  const weakTopics = params.topicScores.filter(ts => ts.scorePercent < 70);
  
  const prompt = `Create a personalized learning plan based on the student's performance.

Topic Scores:
${JSON.stringify(params.topicScores, null, 2)}

Assessment History:
${JSON.stringify(params.assessmentHistory, null, 2)}

Focus on the weakest topics (${weakTopics.map(t => t.topic).join(', ')}). 
Generate a list of actionable steps for the student.
`;

  const systemInstruction = 'You are an adaptive learning coach. Provide a structured plan to help the student improve their weak areas.';

  const result = await ai.generateStructured(
    'create-learning-plan',
    { prompt, systemInstruction },
    LearningPlanSchema,
    'CreateLearningPlan',
    'Creates a structured learning plan'
  );

  return result.data;
}
