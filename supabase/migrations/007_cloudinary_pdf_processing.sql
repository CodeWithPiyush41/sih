-- 007_cloudinary_pdf_processing.sql
-- Idempotent Migration for Cloudinary Storage & PDF Processing Metadata

-------------------------------------------------------------------------------
-- 1. ADD CLOUDINARY AND PROCESSING METADATA COLUMNS TO MATERIALS TABLE
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='cloudinary_public_id') THEN
        ALTER TABLE materials ADD COLUMN cloudinary_public_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='cloudinary_url') THEN
        ALTER TABLE materials ADD COLUMN cloudinary_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='page_count') THEN
        ALTER TABLE materials ADD COLUMN page_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='processing_status') THEN
        ALTER TABLE materials ADD COLUMN processing_status TEXT CHECK (processing_status IN ('pending', 'uploading', 'uploaded', 'processing', 'completed', 'failed')) DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='processing_error') THEN
        ALTER TABLE materials ADD COLUMN processing_error TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='extracted_text_json') THEN
        ALTER TABLE materials ADD COLUMN extracted_text_json JSONB;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. ENFORCE STRICT PRIVACY AND OWNERSHIP RLS POLICIES FOR PERSONAL MATERIALS
-------------------------------------------------------------------------------
-- Ensure Row-Level Security is active
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy: Officers can read their own personal materials ONLY
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Officers read own personal materials') THEN
        CREATE POLICY "Officers read own personal materials" ON materials
            FOR SELECT USING (
                material_type = 'personal_material' AND uploaded_by = auth.uid()
            );
    END IF;

    -- Policy: Officers can manage (insert/update/delete) their own personal materials ONLY
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Officers manage own personal materials') THEN
        CREATE POLICY "Officers manage own personal materials" ON materials
            FOR ALL USING (
                material_type = 'personal_material' AND uploaded_by = auth.uid()
            );
    END IF;
END $$;
