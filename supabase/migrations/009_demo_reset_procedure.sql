-- 009_demo_reset_procedure.sql
-- Safe Demo Data Reset Stored Procedure for SIH26101

CREATE OR REPLACE FUNCTION reset_sih26101_demo_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete material chunks for demo materials only (where file_name starts with demo/test prefix or uploaded by demo IDs)
  DELETE FROM material_chunks
  WHERE material_id IN (
    SELECT id FROM materials WHERE file_name LIKE 'demo_%' OR file_name LIKE 'test_%'
  );

  -- Reset demo materials status
  UPDATE materials
  SET status = 'uploaded',
      processing_status = 'pending',
      indexing_status = 'pending',
      processing_error = NULL,
      indexing_error = NULL,
      extracted_text_json = NULL
  WHERE file_name LIKE 'demo_%' OR file_name LIKE 'test_%';

  -- Reset demo assessment attempts
  DELETE FROM assessment_attempts
  WHERE user_id IN (
    SELECT id FROM profiles WHERE email LIKE '%demo%' OR email LIKE '%test%'
  );

  RAISE NOTICE 'Demo data reset successfully without affecting production user accounts.';
END;
$$;
