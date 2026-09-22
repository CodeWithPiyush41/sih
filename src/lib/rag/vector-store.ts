import { createClient } from '@supabase/supabase-js';
import type { MaterialChunk, RetrievalQueryOptions, RetrievedChunk } from './types';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Idempotently deletes all existing vector chunks for a material.
 */
export async function deleteMaterialChunks(materialId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('material_chunks')
    .delete()
    .eq('material_id', materialId);

  if (error) {
    throw new Error(`Failed to delete existing material chunks for ${materialId}: ${error.message}`);
  }
}

/**
 * Inserts chunks with vector embeddings into material_chunks table in batches.
 */
export async function insertMaterialChunks(chunks: MaterialChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const supabase = getSupabaseAdmin();
  const batchSize = 50;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const insertPayload = batch.map((c) => ({
      material_id: c.materialId,
      chunk_index: c.chunkIndex,
      page_start: c.pageStart,
      page_end: c.pageEnd,
      content: c.content,
      content_length: c.contentLength,
      embedding: JSON.stringify(c.embedding), // Format array for pgvector input
    }));

    const { error } = await supabase
      .from('material_chunks')
      .insert(insertPayload);

    if (error) {
      throw new Error(`Failed to insert vector chunks batch: ${error.message}`);
    }
  }
}

/**
 * Queries Supabase pgvector RPC match_material_chunks function for authorized semantic search.
 */
export async function searchVectorStore(
  queryVector: number[],
  options: RetrievalQueryOptions
): Promise<RetrievedChunk[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc('match_material_chunks', {
    query_embedding: JSON.stringify(queryVector),
    match_threshold: options.minimumSimilarity ?? 0.0,
    match_count: options.topK ?? 5,
    filter_material_id: options.materialId || null,
    user_id: options.userId || null,
  });

  if (error) {
    console.error('Vector similarity RPC error:', error);
    throw new Error(`Supabase vector search failed: ${error.message}`);
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    chunkId: item.id,
    materialId: item.material_id,
    chunkIndex: item.chunk_index,
    pageStart: item.page_start,
    pageEnd: item.page_end,
    content: item.content,
    similarity: parseFloat(item.similarity) || 0.0,
  }));
}
