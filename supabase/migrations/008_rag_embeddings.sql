-- 008_rag_embeddings.sql
-- Idempotent Migration for RAG Vector Search & Embeddings (SIH26101 Phase 9)

-------------------------------------------------------------------------------
-- 1. ENABLE PGVECTOR EXTENSION
-------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-------------------------------------------------------------------------------
-- 2. EXTEND MATERIALS TABLE FOR RAG INDEXING STATUS
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='indexing_status') THEN
        ALTER TABLE materials ADD COLUMN indexing_status TEXT CHECK (indexing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='indexing_error') THEN
        ALTER TABLE materials ADD COLUMN indexing_error TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='indexed_at') THEN
        ALTER TABLE materials ADD COLUMN indexed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 3. CREATE MATERIAL_CHUNKS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_length INTEGER NOT NULL,
    embedding VECTOR(768) NOT NULL, -- Configured for 768-dim models (Gemini text-embedding-004 / nomic-embed-text)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient material filtering and ordering
CREATE INDEX IF NOT EXISTS idx_material_chunks_material_id ON material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_chunk_index ON material_chunks(material_id, chunk_index);

-------------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) ON MATERIAL_CHUNKS
-------------------------------------------------------------------------------
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read chunks of accessible materials" ON material_chunks;

CREATE POLICY "Users read chunks of accessible materials" ON material_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM materials m
            WHERE m.id = material_chunks.material_id
            AND (
                public.get_auth_role() = 'admin' OR
                m.uploaded_by = auth.uid() OR
                (m.material_type = 'teacher_material' AND m.visibility IN ('public', 'course'))
            )
        )
    );

-------------------------------------------------------------------------------
-- 5. AUTHORIZED VECTOR SIMILARITY SEARCH RPC FUNCTION
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_material_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.0,
  match_count INT DEFAULT 5,
  filter_material_id UUID DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  material_id UUID,
  chunk_index INT,
  page_start INT,
  page_end INT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.material_id,
    mc.chunk_index,
    mc.page_start,
    mc.page_end,
    mc.content,
    CAST(1 - (mc.embedding <=> query_embedding) AS FLOAT) AS similarity
  FROM material_chunks mc
  JOIN materials m ON m.id = mc.material_id
  WHERE
    (filter_material_id IS NULL OR mc.material_id = filter_material_id)
    AND (
      user_id IS NULL OR
      user_id = '00000000-0000-0000-0000-000000000000' OR
      m.uploaded_by = user_id OR
      m.visibility IN ('public', 'course')
    )
    AND (1 - (mc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY mc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
