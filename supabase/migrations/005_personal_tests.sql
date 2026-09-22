-- 005_personal_tests.sql

-------------------------------------------------------------------------------
-- 1. MODIFY MATERIALS TABLE
-------------------------------------------------------------------------------
ALTER TABLE materials
ADD COLUMN material_type TEXT CHECK (material_type IN ('teacher_material', 'personal_material')) DEFAULT 'teacher_material',
ADD COLUMN visibility TEXT CHECK (visibility IN ('public', 'private', 'course')) DEFAULT 'course';

-- Make course_id and subject_id nullable since personal materials might not belong to a specific course
ALTER TABLE materials ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE materials ALTER COLUMN subject_id DROP NOT NULL;

-------------------------------------------------------------------------------
-- 2. MODIFY ASSESSMENTS TABLE
-------------------------------------------------------------------------------
ALTER TABLE assessments
ADD COLUMN creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN assessment_type TEXT CHECK (assessment_type IN ('teacher_test', 'personal_test')) DEFAULT 'teacher_test',
ADD COLUMN material_id UUID REFERENCES materials(id) ON DELETE SET NULL;

-- Migrate existing assessments to set creator_id from created_by for backward compatibility
UPDATE assessments SET creator_id = created_by WHERE creator_id IS NULL;

-- Make course_id and subject_id nullable for personal tests
ALTER TABLE assessments ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE assessments ALTER COLUMN subject_id DROP NOT NULL;

-------------------------------------------------------------------------------
-- 3. UPDATE RLS POLICIES FOR MATERIALS
-------------------------------------------------------------------------------
-- Drop existing material policies
DROP POLICY IF EXISTS "Students read enrolled course materials" ON materials;
DROP POLICY IF EXISTS "Teachers manage assigned course materials" ON materials;
DROP POLICY IF EXISTS "Admins manage all materials" ON materials;

-- Recreate policies with personal material support
-- Admins can manage all
CREATE POLICY "Admins manage all materials" ON materials
  FOR ALL USING (public.get_auth_role() = 'admin');

-- Teachers can manage their own materials and materials for their courses
CREATE POLICY "Teachers manage assigned course materials" ON materials
  FOR ALL USING (
    public.get_auth_role() = 'teacher' AND (
      uploaded_by = auth.uid() OR
      course_id IN (SELECT course_id FROM teacher_subjects WHERE teacher_id = auth.uid())
    )
  );

-- Students can read enrolled course materials AND read/manage their own personal materials
CREATE POLICY "Students read course materials" ON materials
  FOR SELECT USING (
    (material_type = 'teacher_material' AND course_id IN (SELECT course_id FROM course_students WHERE student_id = auth.uid())) OR
    (material_type = 'personal_material' AND uploaded_by = auth.uid())
  );

CREATE POLICY "Students insert personal materials" ON materials
  FOR INSERT WITH CHECK (
    public.get_auth_role() = 'student' AND 
    material_type = 'personal_material' AND 
    uploaded_by = auth.uid()
  );

CREATE POLICY "Students update personal materials" ON materials
  FOR UPDATE USING (
    public.get_auth_role() = 'student' AND 
    material_type = 'personal_material' AND 
    uploaded_by = auth.uid()
  );

CREATE POLICY "Students delete personal materials" ON materials
  FOR DELETE USING (
    public.get_auth_role() = 'student' AND 
    material_type = 'personal_material' AND 
    uploaded_by = auth.uid()
  );

-------------------------------------------------------------------------------
-- 4. UPDATE RLS POLICIES FOR ASSESSMENTS
-------------------------------------------------------------------------------
-- Drop existing assessment policies
DROP POLICY IF EXISTS "Students read published assessments" ON assessments;
DROP POLICY IF EXISTS "Teachers and admins manage assessments" ON assessments;

-- Admins manage all
CREATE POLICY "Admins manage all assessments" ON assessments
  FOR ALL USING (public.get_auth_role() = 'admin');

-- Teachers manage their own tests
CREATE POLICY "Teachers manage own tests" ON assessments
  FOR ALL USING (
    public.get_auth_role() = 'teacher' AND 
    (creator_id = auth.uid() OR created_by = auth.uid() OR course_id IN (SELECT course_id FROM teacher_subjects WHERE teacher_id = auth.uid()))
  );

-- Students read published teacher tests and manage their own personal tests
CREATE POLICY "Students read teacher tests" ON assessments
  FOR SELECT USING (
    assessment_type = 'teacher_test' AND 
    status = 'published' AND
    course_id IN (SELECT course_id FROM course_students WHERE student_id = auth.uid())
  );

CREATE POLICY "Students manage personal tests" ON assessments
  FOR ALL USING (
    assessment_type = 'personal_test' AND 
    (creator_id = auth.uid() OR created_by = auth.uid())
  );

-------------------------------------------------------------------------------
-- 5. UPDATE RLS POLICIES FOR QUESTIONS
-------------------------------------------------------------------------------
-- Students also need to be able to insert questions if they belong to their personal tests
-- The previous policy was: "Teachers and admins manage questions"
DROP POLICY IF EXISTS "Teachers and admins manage questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can read questions" ON questions;

CREATE POLICY "Admins manage all questions" ON questions
  FOR ALL USING (public.get_auth_role() = 'admin');

CREATE POLICY "Teachers manage questions" ON questions
  FOR ALL USING (public.get_auth_role() = 'teacher');

-- Students can insert questions for their own personal material
CREATE POLICY "Students insert questions for personal tests" ON questions
  FOR INSERT WITH CHECK (
    public.get_auth_role() = 'student' AND 
    created_by = auth.uid()
  );

CREATE POLICY "Students manage own questions" ON questions
  FOR ALL USING (
    public.get_auth_role() = 'student' AND 
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can read questions" ON questions
  FOR SELECT USING (
    -- Allow reading if they created it OR if they are taking an assessment that contains it
    created_by = auth.uid() OR 
    id IN (
      SELECT question_id FROM assessment_questions aq 
      JOIN assessments a ON a.id = aq.assessment_id 
      WHERE a.status = 'published' OR a.creator_id = auth.uid()
    )
  );

-------------------------------------------------------------------------------
-- 6. UPDATE STORAGE POLICIES
-------------------------------------------------------------------------------
-- Drop existing student read policy to refine it
DROP POLICY IF EXISTS "Students can read enrolled course materials files" ON storage.objects;

-- Re-add student course reading
CREATE POLICY "Students can read enrolled course materials files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'materials' AND 
    EXISTS (
      SELECT 1 FROM public.materials m
      JOIN public.course_students cs ON m.course_id = cs.course_id
      WHERE m.file_path = storage.objects.name
      AND cs.student_id = auth.uid()
      AND m.material_type = 'teacher_material'
    )
  );

-- Students can upload and read their own personal materials
CREATE POLICY "Students can upload personal materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'student' AND
    (storage.foldername(name))[1] = 'personal-materials' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Students can read personal materials files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'student' AND
    (storage.foldername(name))[1] = 'personal-materials' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Students can delete personal materials files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'student' AND
    (storage.foldername(name))[1] = 'personal-materials' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
