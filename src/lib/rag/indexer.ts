import { createClient } from '@supabase/supabase-js';
import { chunkExtractedPdf } from './chunker';
import { getEmbeddingProvider } from './embeddings';
import { deleteMaterialChunks, insertMaterialChunks } from './vector-store';
import type { IndexingResult, MaterialChunk } from './types';
import type { PDFProcessorOutput } from '../pdf/types';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Indexes an uploaded material for RAG vector search:
 * 1. Reads extracted_text_json from materials table.
 * 2. Splits text into page-aware chunks.
 * 3. Generates vector embeddings via configured provider.
 * 4. Stores chunks with embeddings in Supabase material_chunks table.
 * 5. Updates materials.indexing_status.
 */
export async function indexMaterial(materialId: string): Promise<IndexingResult> {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  try {
    // 1. Fetch material record
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('id, title, processing_status, extracted_text_json')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      throw new Error(`Material record not found for ID ${materialId}: ${fetchError?.message}`);
    }

    if (material.processing_status !== 'completed') {
      throw new Error(`Material ${materialId} cannot be indexed because PDF extraction status is '${material.processing_status}'.`);
    }

    const pdfData: PDFProcessorOutput = material.extracted_text_json;
    if (!pdfData || (!pdfData.extractedText && (!pdfData.pages || pdfData.pages.length === 0))) {
      throw new Error(`Material ${materialId} has no extracted text content.`);
    }

    // 2. Mark indexing_status as processing
    await supabase
      .from('materials')
      .update({
        indexing_status: 'processing',
        indexing_error: null,
      })
      .eq('id', materialId);

    // 3. Generate page-aware chunks
    const rawChunks = chunkExtractedPdf(pdfData);

    if (rawChunks.length === 0) {
      throw new Error(`Chunking produced 0 chunks for material ${materialId}.`);
    }

    // 4. Generate embeddings via configured provider
    const provider = getEmbeddingProvider();
    const contents = rawChunks.map((c) => c.content);
    const embeddings = await provider.embedBatch(contents);

    if (embeddings.length !== rawChunks.length) {
      throw new Error(`Generated embeddings count (${embeddings.length}) mismatched chunks count (${rawChunks.length}).`);
    }

    // 5. Construct full MaterialChunk objects with vector dimension validation
    const targetDim = provider.getDimension();
    const chunksToInsert: MaterialChunk[] = rawChunks.map((rc, idx) => {
      const vector = embeddings[idx];
      if (!vector || vector.length !== targetDim) {
        throw new Error(`Vector dimension mismatch at chunk ${idx}: expected ${targetDim}, received ${vector?.length}.`);
      }
      return {
        ...rc,
        materialId,
        embedding: vector,
      };
    });

    // 6. Delete old chunks (idempotent overwrite) & insert new chunks
    await deleteMaterialChunks(materialId);
    await insertMaterialChunks(chunksToInsert);

    // 7. Update material indexing status to completed
    await supabase
      .from('materials')
      .update({
        indexing_status: 'completed',
        indexing_error: null,
        indexed_at: new Date().toISOString(),
      })
      .eq('id', materialId);

    const durationMs = Date.now() - startTime;
    return {
      materialId,
      chunkCount: chunksToInsert.length,
      durationMs,
      indexingStatus: 'completed',
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Indexing failed due to an unexpected error.';
    console.error(`[RAG Indexer] Indexing failed for material ${materialId}:`, errorMessage);

    await supabase
      .from('materials')
      .update({
        indexing_status: 'failed',
        indexing_error: errorMessage,
      })
      .eq('id', materialId);

    return {
      materialId,
      chunkCount: 0,
      durationMs: Date.now() - startTime,
      indexingStatus: 'failed',
      error: errorMessage,
    };
  }
}
