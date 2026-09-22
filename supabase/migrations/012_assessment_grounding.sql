-- 012_assessment_grounding.sql
-- Extension for Phase 12 Assessment Grounding & Validation

-------------------------------------------------------------------------------
-- 1. ADD GROUNDING & VALIDATION COLUMNS TO QUESTIONS TABLE
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='explanation') THEN
        ALTER TABLE questions ADD COLUMN explanation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='chunk_id') THEN
        ALTER TABLE questions ADD COLUMN chunk_id UUID REFERENCES material_chunks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='page_start') THEN
        ALTER TABLE questions ADD COLUMN page_start INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='page_end') THEN
        ALTER TABLE questions ADD COLUMN page_end INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='evidence_snippet') THEN
        ALTER TABLE questions ADD COLUMN evidence_snippet TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='validation_status') THEN
        ALTER TABLE questions ADD COLUMN validation_status TEXT DEFAULT 'approved';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='competency_area') THEN
        ALTER TABLE questions ADD COLUMN competency_area TEXT;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. CREATE INDEXES FOR QUESTION SOURCES & TOPICS
-------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_chunk_id ON questions(chunk_id);
CREATE INDEX IF NOT EXISTS idx_questions_material_id ON questions(material_id);
