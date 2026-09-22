import { getEmbeddingProvider } from './embeddings';
import { searchVectorStore } from './vector-store';
import type { RetrievalQueryOptions, RetrievedChunk } from './types';

/**
 * Performs authenticated semantic search across indexed statistical training materials.
 * Returns relevant page-aware evidence chunks without LLM answer generation.
 */
export async function retrieveRelevantChunks(
  options: RetrievalQueryOptions
): Promise<RetrievedChunk[]> {
  if (!options.query || options.query.trim().length === 0) {
    throw new Error('Retrieval query string cannot be empty.');
  }

  const provider = getEmbeddingProvider();
  
  // 1. Generate query embedding vector
  const queryVector = await provider.embedText(options.query.trim());

  // 2. Perform authorized vector similarity search in Supabase
  const results = await searchVectorStore(queryVector, {
    query: options.query,
    materialId: options.materialId,
    userId: options.userId,
    topK: options.topK || 5,
    minimumSimilarity: options.minimumSimilarity || 0.0,
  });

  return results;
}
