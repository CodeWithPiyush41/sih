export interface RawChunkInput {
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  contentLength: number;
}

export interface MaterialChunk extends RawChunkInput {
  id?: string;
  materialId: string;
  embedding?: number[];
  createdAt?: string;
}

export interface RetrievalQueryOptions {
  query: string;
  materialId?: string;
  userId?: string;
  topK?: number;
  minimumSimilarity?: number;
}

export interface RetrievedChunk {
  chunkId: string;
  materialId: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  similarity: number;
}

export interface EmbeddingProviderConfig {
  provider: 'gemini' | 'ollama';
  model: string;
  dimension: number;
  maxBatchSize: number;
}

export interface IndexingResult {
  materialId: string;
  chunkCount: number;
  durationMs: number;
  indexingStatus: 'completed' | 'failed';
  error?: string;
}
