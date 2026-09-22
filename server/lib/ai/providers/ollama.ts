import { z } from 'zod';
import { AIInput, AIProvider, AIResponse, StructuredAIResponse } from '../types';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private modelName: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.modelName = process.env.OLLAMA_MODEL || 'qwen3:4b';
    this.timeoutMs = parseInt(process.env.AI_CHAT_TIMEOUT_MS || '60000', 10);
  }

  public getModelName(): string {
    return this.modelName;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  private constructPrompt(input: AIInput): string {
    return input.systemInstruction 
      ? `System: ${input.systemInstruction}\n\nUser: ${input.prompt}` 
      : input.prompt;
  }

  async generateText(input: AIInput): Promise<AIResponse> {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          prompt: this.constructPrompt(input),
          stream: false,
          options: {
            temperature: input.temperature ?? 0.7
          }
        })
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Ollama service returned status ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      return {
        text: data.response || 'No response generated.',
        provider: 'ollama',
        model: this.modelName,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('AI Assistant request timed out. Please try again.');
      }
      if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error('AI Assistant is temporarily unavailable. Please make sure the local AI service is running.');
      }
      throw err;
    }
  }

  async generateStructured<T>(
    input: AIInput,
    schema: z.ZodSchema<T>,
    schemaName?: string,
    schemaDescription?: string
  ): Promise<StructuredAIResponse<T>> {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const prompt = `You are a strict JSON data generator. Output ONLY raw JSON matching the requested structure. Do not output markdown, backticks, or any conversational text.
    
    ${input.systemInstruction ? `Instruction: ${input.systemInstruction}\n\n` : ''}
    User request: ${input.prompt}`;

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: input.temperature ?? 0.2
          }
        })
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Ollama service returned status ${res.status}: ${res.statusText}`);
      }

      const jsonRes = await res.json();
      let text = (jsonRes.response || '').trim();

      try {
        const parsed = JSON.parse(text);
        const data = schema.parse(parsed);
        
        return {
          data,
          provider: 'ollama',
          model: this.modelName,
          latencyMs: Date.now() - start,
        };
      } catch (e) {
        console.error('Failed to parse or validate Ollama structured output:', text, e);
        throw new Error('Invalid JSON format from Ollama');
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('AI Assistant request timed out. Please try again.');
      }
      if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error('AI Assistant is temporarily unavailable. Please make sure the local AI service is running.');
      }
      throw err;
    }
  }
}
