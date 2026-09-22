import { AITaskType } from '../types';

export const AI_CONFIG = {
  mode: process.env.AI_MODE || 'demo',
  primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'gemini',
  fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'ollama',
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '5000', 10),
  maxRetries: 1,
};

// Map each task to its preferred provider. 
// If not specified, the orchestrator will default to AI_CONFIG.primaryProvider
export const TASK_PROVIDER_MAP: Partial<Record<AITaskType, string>> = {
  'analyze-pdf': process.env.PDF_ANALYSIS_PROVIDER,
  'extract-topics': process.env.TOPIC_EXTRACTION_PROVIDER,
  'generate-questions': process.env.QUESTION_GENERATION_PROVIDER,
  'validate-question': process.env.QUESTION_VALIDATION_PROVIDER || 'ollama', // Validation usually good on local
  'evaluate-answer': process.env.ANSWER_EVALUATION_PROVIDER,
  'create-learning-plan': process.env.LEARNING_PLAN_PROVIDER || 'ollama',
  'analyze-code': process.env.CODE_ANALYSIS_PROVIDER || 'ollama',
};

export function getProviderForTask(task: AITaskType): string {
  return TASK_PROVIDER_MAP[task] || AI_CONFIG.primaryProvider;
}
