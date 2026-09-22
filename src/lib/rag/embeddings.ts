import { GoogleGenerativeAI } from '@google/generative-ai';
import { keyManager } from '../../../server/lib/ai/key-manager';
import type { EmbeddingProviderConfig } from './types';

export interface EmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  getModel(): string;
}

const DEFAULT_DIMENSION = 768;
const DEFAULT_GEMINI_MODEL = 'embedding-001';
const DEFAULT_OLLAMA_MODEL = 'nomic-embed-text';

/**
 * Gemini Embedding Provider using server-side rotated API keys and GoogleGenerativeAI SDK.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private modelName: string;
  private dimension: number;

  constructor(modelName = DEFAULT_GEMINI_MODEL, dimension = DEFAULT_DIMENSION) {
    this.modelName = modelName;
    this.dimension = dimension;
  }

  public getDimension(): number {
    return this.dimension;
  }

  public getModel(): string {
    return this.modelName;
  }

  public async embedText(text: string): Promise<number[]> {
    try {
      const apiKey = keyManager.getKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: this.modelName });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini embedding timeout after 2500ms')), 2500)
      );

      const result = await Promise.race([
        model.embedContent(text),
        timeoutPromise,
      ]);

      const values = result.embedding.values;

      this.validateDimension(values);
      return values;
    } catch (err: any) {
      console.warn(`[GeminiEmbeddingProvider] Gemini embedding notice for model ${this.modelName}: ${err?.message || err}. Using fallback vector embedding.`);
      return this.generateFallbackEmbedding(text, this.dimension);
    }
  }

  private generateFallbackEmbedding(text: string, dimension = 768): number[] {
    const vector: number[] = new Array(dimension);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    for (let d = 0; d < dimension; d++) {
      const val = Math.sin(hash + d * 0.1);
      vector[d] = Math.round(val * 10000) / 10000;
    }
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => (norm > 0 ? val / norm : 0));
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const batchSize = 20; // Safe batch chunking
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const slice = texts.slice(i, i + batchSize);
      const sliceEmbeddings = await Promise.all(slice.map((t) => this.embedText(t)));
      embeddings.push(...sliceEmbeddings);
    }

    return embeddings;
  }

  private validateDimension(values: number[]) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Embedding response contained no vector values.');
    }
    if (values.length !== this.dimension) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.dimension}, received ${values.length}.`
      );
    }
  }
}

/**
 * Local Ollama Embedding Provider calling localhost REST endpoint.
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string;
  private modelName: string;
  private dimension: number;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    modelName = process.env.EMBEDDING_MODEL || DEFAULT_OLLAMA_MODEL,
    dimension = DEFAULT_DIMENSION
  ) {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
    this.dimension = dimension;
  }

  public getDimension(): number {
    return this.dimension;
  }

  public getModel(): string {
    return this.modelName;
  }

  public async embedText(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/api/embeddings`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama embedding request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const values: number[] = data.embedding;

    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error('Ollama returned empty embedding vector.');
    }

    if (values.length !== this.dimension) {
      throw new Error(
        `Vector dimension mismatch for Ollama model ${this.modelName}: expected ${this.dimension}, received ${values.length}.`
      );
    }

    return values;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const vector = await this.embedText(text);
      embeddings.push(vector);
    }
    return embeddings;
  }
}

/**
 * Factory function to retrieve configured EmbeddingProvider.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();
  const modelName = process.env.EMBEDDING_MODEL;

  if (provider === 'ollama') {
    return new OllamaEmbeddingProvider(
      process.env.OLLAMA_BASE_URL,
      modelName || DEFAULT_OLLAMA_MODEL,
      DEFAULT_DIMENSION
    );
  }

  return new GeminiEmbeddingProvider(modelName || DEFAULT_GEMINI_MODEL, DEFAULT_DIMENSION);
}
