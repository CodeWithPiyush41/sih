import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AIInput, AIProvider, AIResponse, StructuredAIResponse } from '../types';
import { keyManager } from '../key-manager';

export class GeminiProvider implements AIProvider {
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async isAvailable(): Promise<boolean> {
    return keyManager.getAvailableKeyCount() > 0;
  }

  private async executeWithKeyRotation<T>(
    operation: (genAI: GoogleGenerativeAI) => Promise<T>,
    maxAttempts = 2
  ): Promise<T> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const key = keyManager.getKey(); // Will throw AI_RATE_LIMITED if all on cooldown
      const genAI = new GoogleGenerativeAI(key);
      
      try {
        return await operation(genAI);
      } catch (error: any) {
        const isRateLimit = error?.status === 429 || error?.message?.includes('429');
        const isQuota = error?.status === 403 || error?.message?.includes('quota');
        
        if (isRateLimit || isQuota) {
          keyManager.markKeyUnavailable(key);
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('AI_RATE_LIMITED');
          }
          console.log(`Retrying Gemini request with next key (attempt ${attempts + 1}/${maxAttempts})...`);
        } else {
          // Some other error, throw immediately (e.g. invalid prompt, 500)
          throw error;
        }
      }
    }
    
    throw new Error('AI_RATE_LIMITED');
  }

  async generateText(input: AIInput): Promise<AIResponse> {
    const start = Date.now();
    
    const text = await this.executeWithKeyRotation(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: input.systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
        generationConfig: {
          temperature: input.temperature ?? 0.7,
        },
      });
      return result.response.text();
    });

    return {
      text,
      provider: 'gemini',
      model: this.modelName,
      latencyMs: Date.now() - start,
    };
  }

  async generateStructured<T>(
    input: AIInput,
    schema: z.ZodSchema<T>,
    schemaName = 'StructuredOutput',
    schemaDescription = 'JSON structured output'
  ): Promise<StructuredAIResponse<T>> {
    const start = Date.now();
    
    // Convert Zod schema to JSON Schema for Gemini
    const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7' }) as any;
    
    const mapType = (type: string): SchemaType => {
      switch (type) {
        case 'string': return SchemaType.STRING;
        case 'number':
        case 'integer': return SchemaType.NUMBER;
        case 'boolean': return SchemaType.BOOLEAN;
        case 'array': return SchemaType.ARRAY;
        case 'object': return SchemaType.OBJECT;
        default: return SchemaType.STRING;
      }
    };

    const convertSchema = (jsSchema: any): any => {
      const result: any = { type: mapType(jsSchema.type) };
      if (jsSchema.description) result.description = jsSchema.description;
      if (jsSchema.items) result.items = convertSchema(jsSchema.items);
      if (jsSchema.properties) {
        result.properties = {};
        for (const [key, val] of Object.entries(jsSchema.properties)) {
          result.properties[key] = convertSchema(val);
        }
      }
      if (jsSchema.required) result.required = jsSchema.required;
      if (jsSchema.enum) result.enum = jsSchema.enum;
      return result;
    };

    const geminiSchema = convertSchema(jsonSchema);

    const text = await this.executeWithKeyRotation(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: input.systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          responseMimeType: 'application/json',
          responseSchema: geminiSchema,
        },
      });
      return result.response.text();
    });

    try {
      const parsed = JSON.parse(text);
      const data = schema.parse(parsed);
      return {
        data,
        provider: 'gemini',
        model: this.modelName,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      console.error('Failed to parse or validate Gemini structured output:', e);
      throw new Error('AI_INVALID_RESPONSE');
    }
  }
}
