import { z } from 'zod';

export const SubTopicSchema = z.object({
  name: z.string().describe('The name of the subtopic'),
});

export const TopicSchema = z.object({
  name: z.string().describe('The main topic name'),
  subtopics: z.array(z.string()).describe('A list of subtopics covered under this main topic'),
});

export const ExtractTopicsResponseSchema = z.object({
  topics: z.array(TopicSchema).describe('The list of extracted topics and their subtopics'),
});

export type ExtractedTopic = z.infer<typeof TopicSchema>;
export type ExtractTopicsResponse = z.infer<typeof ExtractTopicsResponseSchema>;
