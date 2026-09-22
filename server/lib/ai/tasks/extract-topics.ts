import { ai } from '../orchestrator/router';
import { ExtractTopicsResponseSchema, ExtractTopicsResponse } from '../schemas/topic';

export async function extractTopics(textContext: string): Promise<ExtractTopicsResponse> {
  const prompt = `Analyze the following educational material text and extract the main topics and subtopics covered in it.
  
Text Context:
${textContext.substring(0, 15000)} // Truncate to avoid massive tokens for now
`;

  const systemInstruction = 'You are an expert curriculum designer. Extract the main logical topics and subtopics from the provided text.';

  const result = await ai.generateStructured(
    'extract-topics',
    { prompt, systemInstruction },
    ExtractTopicsResponseSchema,
    'ExtractTopics',
    'Extracts topics and subtopics from educational text'
  );

  return result.data;
}
