import { z } from 'zod';
import { AIProvider, AIInput, AIResponse, StructuredAIResponse, AITaskType } from '../types';
import { GeminiProvider } from '../providers/gemini';
import { OllamaProvider } from '../providers/ollama';
import { getProviderForTask } from './config';
import { executeWithFallback } from './fallback';

export class AIOrchestrator {
  private providers: Record<string, AIProvider>;

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      ollama: new OllamaProvider(),
    };
  }

  private logTask(task: AITaskType, providerName: string, success: boolean, latencyMs: number, error?: any) {
    console.log(JSON.stringify({
      provider: providerName,
      task,
      success,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      error_category: error ? error.message : null
    }));
  }

  async getHealth() {
    const geminiAvailable = await this.providers.gemini.isAvailable();
    const ollamaAvailable = await this.providers.ollama.isAvailable();

    return {
      gemini: geminiAvailable ? 'available' : 'unavailable',
      ollama: ollamaAvailable ? 'available' : 'unavailable'
    };
  }

  async generateStructured<T>(
    task: AITaskType,
    input: AIInput,
    schema: z.ZodSchema<T>,
    schemaName?: string,
    schemaDescription?: string
  ): Promise<StructuredAIResponse<T>> {
    const preferredProviderName = getProviderForTask(task);
    const fallbackProviderName = preferredProviderName === 'gemini' ? 'ollama' : 'gemini';

    const primary = this.providers[preferredProviderName];
    const fallback = this.providers[fallbackProviderName];

    let usedProvider = preferredProviderName;
    try {
      const result = await executeWithFallback(
        (provider) => {
          usedProvider = provider instanceof GeminiProvider ? 'gemini' : 'ollama';
          return provider.generateStructured(input, schema, schemaName, schemaDescription);
        },
        primary,
        fallback
      );
      this.logTask(task, result.provider, true, result.latencyMs);
      return result;
    } catch (e: any) {
      this.logTask(task, usedProvider, false, 0, e);
      throw e;
    }
  }

  async generateText(
    task: AITaskType,
    input: AIInput
  ): Promise<AIResponse> {
    const preferredProviderName = getProviderForTask(task);
    const fallbackProviderName = preferredProviderName === 'gemini' ? 'ollama' : 'gemini';

    const primary = this.providers[preferredProviderName];
    const fallback = this.providers[fallbackProviderName];

    let usedProvider = preferredProviderName;
    try {
      const result = await executeWithFallback(
        (provider) => {
          usedProvider = provider instanceof GeminiProvider ? 'gemini' : 'ollama';
          return provider.generateText(input);
        },
        primary,
        fallback
      );
      this.logTask(task, result.provider, true, result.latencyMs);
      return result;
    } catch (e: any) {
      this.logTask(task, usedProvider, false, 0, e);
      throw e;
    }
  }
}

// Export singleton instance
export const ai = new AIOrchestrator();
