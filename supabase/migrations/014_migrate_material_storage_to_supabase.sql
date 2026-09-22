-- =============================================================================
-- Migration: 014_migrate_material_storage_to_supabase.sql
-- Description: Replace Cloudinary with Supabase Storage 'training-materials' bucket
-- Domain: SIH26101 - Official Statistical System
-- =============================================================================

-- 1. Create private 'training-materials' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('training-materials', 'training-materials', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf'];

-- 2. Add Supabase Storage columns to materials table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='storage_bucket') THEN
        ALTER TABLE materials ADD COLUMN storage_bucket TEXT DEFAULT 'training-materials';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='storage_path') THEN
        ALTER TABLE materials ADD COLUMN storage_path TEXT;
    END IF;
END $$;

-- 3. Storage RLS Policies for 'training-materials' bucket
DO $$
BEGIN
    -- Authenticated Users can upload to their own folder path: {userId}/{materialId}/original.pdf
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users upload own training materials') THEN
        CREATE POLICY "Users upload own training materials" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'training-materials' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;

    -- Authenticated Users can read their own uploaded files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own training materials') THEN
        CREATE POLICY "Users read own training materials" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'training-materials' AND (
                    (storage.foldername(name))[1] = auth.uid()::text OR
                    public.get_auth_role() IN ('teacher', 'admin')
                )
            );
    END IF;

    -- Authenticated Users can manage (update/delete) their own uploaded files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own training materials') THEN
        CREATE POLICY "Users manage own training materials" ON storage.objects
            FOR ALL USING (
                bucket_id = 'training-materials' AND (
                    (storage.foldername(name))[1] = auth.uid()::text OR
                    public.get_auth_role() = 'admin'
                )
            );
    END IF;
END $$;
