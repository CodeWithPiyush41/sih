-- 003_storage_policies.sql

-- Insert the 'materials' bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies

-- Admins can do everything
CREATE POLICY "Admins have full access to materials bucket" ON storage.objects
  FOR ALL USING (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'admin'
  );

-- Teachers can upload and read their own materials
CREATE POLICY "Teachers can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'teacher'
  );

CREATE POLICY "Teachers can manage own uploads" ON storage.objects
  FOR ALL USING (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'teacher' AND 
    owner = auth.uid()
  );

-- Students can read materials if they have access to the corresponding database record
CREATE POLICY "Students can read enrolled course materials files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'materials' AND 
    EXISTS (
      SELECT 1 FROM public.materials m
      JOIN public.course_students cs ON m.course_id = cs.course_id
      WHERE m.file_path = storage.objects.name
      AND cs.student_id = auth.uid()
    )
  );

-- Teachers can read materials if they are assigned to the course
CREATE POLICY "Teachers can read assigned course materials files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'materials' AND 
    public.get_auth_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM public.materials m
      JOIN public.teacher_subjects ts ON m.course_id = ts.course_id
      WHERE m.file_path = storage.objects.name
      AND ts.teacher_id = auth.uid()
    )
  );
