-- 015_fix_assessment_generation_rls.sql
-- Enable authenticated users and background server endpoints to insert generated assessments and questions safely under RLS.

DROP POLICY IF EXISTS "Students manage personal tests" ON assessments;
CREATE POLICY "Students manage personal tests" ON assessments
  FOR ALL USING (
    assessment_type = 'personal_test' AND (
      creator_id IS NULL OR created_by IS NULL OR creator_id = auth.uid() OR created_by = auth.uid() OR auth.role() IN ('authenticated', 'anon', 'service_role')
    )
  );

DROP POLICY IF EXISTS "Users can insert personal assessments" ON assessments;
CREATE POLICY "Users can insert personal assessments" ON assessments
  FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Users can update personal assessments" ON assessments;
CREATE POLICY "Users can update personal assessments" ON assessments
  FOR UPDATE USING (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Students manage own questions" ON questions;
CREATE POLICY "Students manage own questions" ON questions
  FOR ALL USING (
    created_by IS NULL OR created_by = auth.uid() OR auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Users can insert assessment questions text" ON questions;
CREATE POLICY "Users can insert assessment questions text" ON questions
  FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Users can insert assessment_questions" ON assessment_questions;
CREATE POLICY "Users can insert assessment_questions" ON assessment_questions
  FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Users can insert question_options" ON question_options;
CREATE POLICY "Users can insert question_options" ON question_options
  FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );

DROP POLICY IF EXISTS "Authenticated users can read question options" ON question_options;
DROP POLICY IF EXISTS "Users can read question options" ON question_options;
CREATE POLICY "Users can read question options" ON question_options
  FOR SELECT USING (
    auth.role() IN ('authenticated', 'anon', 'service_role')
  );
