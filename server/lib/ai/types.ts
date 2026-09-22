import { z } from 'zod';

export interface AIInput {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface StructuredAIResponse<T> {
  data: T;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface AIProvider {
  /** Check if the provider is currently available (e.g. valid API key or reachable server) */
  isAvailable(): Promise<boolean>;

  /** Generate raw text */
  generateText(input: AIInput): Promise<AIResponse>;

  /** Generate structured output conforming to a Zod schema */
  generateStructured<T>(input: AIInput, schema: z.ZodSchema<T>, schemaName?: string, schemaDescription?: string): Promise<StructuredAIResponse<T>>;
}

// Tasks we support
export type AITaskType = 
  | 'analyze-pdf'
  | 'extract-topics'
  | 'generate-questions'
  | 'validate-question'
  | 'evaluate-answer'
  | 'create-learning-plan'
  | 'analyze-code';

export interface AIStatus {
  gemini: 'available' | 'unavailable';
  ollama: 'available' | 'unavailable';
}
