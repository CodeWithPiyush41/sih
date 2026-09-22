-- 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_scores ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role without causing infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-------------------------------------------------------------------------------
-- PROFILES
-------------------------------------------------------------------------------
-- Everyone can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins and Teachers can read all profiles (to see their students)
CREATE POLICY "Teachers and admins can read all profiles" ON profiles
  FOR SELECT USING (get_auth_role() IN ('teacher', 'admin'));

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
-- Note: preventing role updates requires a trigger or column level security.
-- We will enforce this via an update trigger.
CREATE OR REPLACE FUNCTION prevent_role_update() RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND get_auth_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_role_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_update();

-------------------------------------------------------------------------------
-- SUBJECTS & COURSES
-------------------------------------------------------------------------------
-- Anyone authenticated can read subjects and courses (for dropdowns, listings, etc)
CREATE POLICY "Authenticated users can read subjects" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify subjects and courses
CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (get_auth_role() = 'admin');

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (get_auth_role() = 'admin');

-------------------------------------------------------------------------------
-- TEACHER SUBJECTS & COURSE STUDENTS (Assignments)
-------------------------------------------------------------------------------
-- Teachers can see their own assignments, Admins see all
CREATE POLICY "Users can read teacher_subjects" ON teacher_subjects
  FOR SELECT USING (
    get_auth_role() = 'admin' OR 
    (get_auth_role() = 'teacher' AND teacher_id = auth.uid())
  );

-- Admins can manage teacher assignments
CREATE POLICY "Admins manage teacher_subjects" ON teacher_subjects
  FOR ALL USING (get_auth_role() = 'admin');

-- Teachers and admins can see course students
CREATE POLICY "Read course_students" ON course_students
  FOR SELECT USING (
    get_auth_role() IN ('admin', 'teacher') OR
    student_id = auth.uid()
  );

-- Admins can manage course students
CREATE POLICY "Admins manage course_students" ON course_students
  FOR ALL USING (get_auth_role() = 'admin');

-------------------------------------------------------------------------------
-- MATERIALS
-------------------------------------------------------------------------------
-- Students can read materials for courses they are enrolled in
CREATE POLICY "Students read enrolled course materials" ON materials
  FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_students WHERE student_id = auth.uid())
  );

-- Teachers can read and manage materials for their assigned courses
CREATE POLICY "Teachers manage assigned course materials" ON materials
  FOR ALL USING (
    course_id IN (SELECT course_id FROM teacher_subjects WHERE teacher_id = auth.uid())
  );

-- Admins can manage all materials
CREATE POLICY "Admins manage all materials" ON materials
  FOR ALL USING (get_auth_role() = 'admin');

-------------------------------------------------------------------------------
-- TOPICS, QUESTIONS, & OPTIONS
-------------------------------------------------------------------------------
-- Everyone can read topics
CREATE POLICY "Authenticated users can read topics" ON topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins manage topics" ON topics
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

-- Questions and Options
CREATE POLICY "Authenticated users can read questions" ON questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins manage questions" ON questions
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Authenticated users can read question options" ON question_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins manage question options" ON question_options
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

-------------------------------------------------------------------------------
-- ASSESSMENTS & ASSESSMENT QUESTIONS
-------------------------------------------------------------------------------
-- Students can read assessments for their courses if published
CREATE POLICY "Students read published assessments" ON assessments
  FOR SELECT USING (
    status = 'published' AND
    course_id IN (SELECT course_id FROM course_students WHERE student_id = auth.uid())
  );

-- Teachers and admins manage assessments
CREATE POLICY "Teachers and admins manage assessments" ON assessments
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Students read assessment questions" ON assessment_questions
  FOR SELECT USING (
    assessment_id IN (SELECT id FROM assessments WHERE status = 'published')
  );

CREATE POLICY "Teachers and admins manage assessment questions" ON assessment_questions
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

-------------------------------------------------------------------------------
-- ASSESSMENT ATTEMPTS
-------------------------------------------------------------------------------
-- Students can read, create, and update their own attempts
CREATE POLICY "Students manage own attempts" ON assessment_attempts
  FOR ALL USING (student_id = auth.uid());

-- Teachers can read attempts for their courses
CREATE POLICY "Teachers read attempts" ON assessment_attempts
  FOR SELECT USING (
    assessment_id IN (SELECT id FROM assessments WHERE course_id IN (SELECT course_id FROM teacher_subjects WHERE teacher_id = auth.uid()))
  );

-- Admins can read all attempts
CREATE POLICY "Admins read all attempts" ON assessment_attempts
  FOR SELECT USING (get_auth_role() = 'admin');

-------------------------------------------------------------------------------
-- ATTEMPT ANSWERS & TOPIC SCORES
-------------------------------------------------------------------------------
-- Students can manage answers for their own attempts
CREATE POLICY "Students manage own answers" ON attempt_answers
  FOR ALL USING (
    attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = auth.uid())
  );

CREATE POLICY "Teachers read answers" ON attempt_answers
  FOR SELECT USING (get_auth_role() IN ('teacher', 'admin'));

-- Students can read their own topic scores
CREATE POLICY "Students read own topic scores" ON topic_scores
  FOR SELECT USING (student_id = auth.uid());

-- Teachers and admins can read topic scores
CREATE POLICY "Teachers and admins read topic scores" ON topic_scores
  FOR SELECT USING (get_auth_role() IN ('teacher', 'admin'));

-- Only backend functions or teachers/admins can insert/update topic scores
CREATE POLICY "Teachers and admins manage topic scores" ON topic_scores
  FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));
