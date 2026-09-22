-- 017_auth_roles_and_rls_audit.sql
-- Audit and enforce strict RLS policies for Officer (student), Training Coordinator (teacher), and Administrator (admin)

-- 1. Helper Function to resolve role safely without infinite RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Ensure missing auxiliary tables exist
CREATE TABLE IF NOT EXISTS public.users_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  overall_score NUMERIC,
  status_tier TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT,
  source_type TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS across all 14 core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igot_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nssta_programmes ENABLE ROW LEVEL SECURITY;

-- 4. Audit & Policy Setup Across All 14 Tables

-- PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coordinators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles SELECT policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles UPDATE policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles INSERT/DELETE policy" ON public.profiles;

CREATE POLICY "Profiles SELECT policy" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Profiles UPDATE policy" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR get_auth_role() = 'admin');

CREATE POLICY "Profiles INSERT/DELETE policy" ON public.profiles FOR ALL
  USING (get_auth_role() = 'admin');

-- USERS_ROLES
DROP POLICY IF EXISTS "Users can view own role" ON public.users_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.users_roles;
DROP POLICY IF EXISTS "Users Roles SELECT policy" ON public.users_roles;
DROP POLICY IF EXISTS "Users Roles ALL policy" ON public.users_roles;

CREATE POLICY "Users Roles SELECT policy" ON public.users_roles FOR SELECT
  USING (user_id = auth.uid() OR get_auth_role() = 'admin');

CREATE POLICY "Users Roles ALL policy" ON public.users_roles FOR ALL
  USING (get_auth_role() = 'admin');

-- ASSESSMENTS
DROP POLICY IF EXISTS "Students read published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers and admins manage assessments" ON public.assessments;
DROP POLICY IF EXISTS "Assessments SELECT policy" ON public.assessments;
DROP POLICY IF EXISTS "Assessments WRITE policy" ON public.assessments;

CREATE POLICY "Assessments SELECT policy" ON public.assessments FOR SELECT
  USING (status = 'published' OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Assessments WRITE policy" ON public.assessments FOR ALL
  USING (get_auth_role() IN ('teacher', 'admin'));

-- ASSESSMENT_QUESTIONS
DROP POLICY IF EXISTS "Students read assessment questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Teachers and admins manage assessment questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Assessment Questions SELECT policy" ON public.assessment_questions;
DROP POLICY IF EXISTS "Assessment Questions WRITE policy" ON public.assessment_questions;

CREATE POLICY "Assessment Questions SELECT policy" ON public.assessment_questions FOR SELECT
  USING (TRUE);

CREATE POLICY "Assessment Questions WRITE policy" ON public.assessment_questions FOR ALL
  USING (get_auth_role() IN ('teacher', 'admin'));

-- ASSESSMENT_ATTEMPTS
DROP POLICY IF EXISTS "Students manage own attempts" ON public.assessment_attempts;
DROP POLICY IF EXISTS "Teachers read attempts" ON public.assessment_attempts;
DROP POLICY IF EXISTS "Admins read all attempts" ON public.assessment_attempts;
DROP POLICY IF EXISTS "Attempts SELECT policy" ON public.assessment_attempts;
DROP POLICY IF EXISTS "Attempts INSERT/UPDATE policy" ON public.assessment_attempts;

CREATE POLICY "Attempts SELECT policy" ON public.assessment_attempts FOR SELECT
  USING (student_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Attempts INSERT/UPDATE policy" ON public.assessment_attempts FOR ALL
  USING (student_id = auth.uid() OR get_auth_role() = 'admin');

-- ATTEMPT_ANSWERS
DROP POLICY IF EXISTS "Students manage own answers" ON public.attempt_answers;
DROP POLICY IF EXISTS "Teachers read answers" ON public.attempt_answers;
DROP POLICY IF EXISTS "Attempt Answers SELECT policy" ON public.attempt_answers;
DROP POLICY IF EXISTS "Attempt Answers WRITE policy" ON public.attempt_answers;

CREATE POLICY "Attempt Answers SELECT policy" ON public.attempt_answers FOR SELECT
  USING (
    attempt_id IN (SELECT id FROM public.assessment_attempts WHERE student_id = auth.uid()) OR
    get_auth_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Attempt Answers WRITE policy" ON public.attempt_answers FOR ALL
  USING (
    attempt_id IN (SELECT id FROM public.assessment_attempts WHERE student_id = auth.uid()) OR
    get_auth_role() = 'admin'
  );

-- SKILL_PROFILES
DROP POLICY IF EXISTS "Officers view own skill profile" ON public.skill_profiles;
DROP POLICY IF EXISTS "Officers update own skill profile" ON public.skill_profiles;
DROP POLICY IF EXISTS "Skill Profiles SELECT policy" ON public.skill_profiles;
DROP POLICY IF EXISTS "Skill Profiles WRITE policy" ON public.skill_profiles;

CREATE POLICY "Skill Profiles SELECT policy" ON public.skill_profiles FOR SELECT
  USING (user_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Skill Profiles WRITE policy" ON public.skill_profiles FOR ALL
  USING (user_id = auth.uid() OR get_auth_role() = 'admin');

-- TOPIC_SCORES
DROP POLICY IF EXISTS "Students read own topic scores" ON public.topic_scores;
DROP POLICY IF EXISTS "Teachers and admins read topic scores" ON public.topic_scores;
DROP POLICY IF EXISTS "Teachers and admins manage topic scores" ON public.topic_scores;
DROP POLICY IF EXISTS "Topic Scores SELECT policy" ON public.topic_scores;
DROP POLICY IF EXISTS "Topic Scores WRITE policy" ON public.topic_scores;

CREATE POLICY "Topic Scores SELECT policy" ON public.topic_scores FOR SELECT
  USING (student_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Topic Scores WRITE policy" ON public.topic_scores FOR ALL
  USING (student_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

-- MATERIALS
DROP POLICY IF EXISTS "Students read enrolled course materials" ON public.materials;
DROP POLICY IF EXISTS "Teachers manage assigned course materials" ON public.materials;
DROP POLICY IF EXISTS "Admins manage all materials" ON public.materials;
DROP POLICY IF EXISTS "Materials SELECT policy" ON public.materials;
DROP POLICY IF EXISTS "Materials WRITE policy" ON public.materials;

CREATE POLICY "Materials SELECT policy" ON public.materials FOR SELECT
  USING (TRUE);

CREATE POLICY "Materials WRITE policy" ON public.materials FOR ALL
  USING (get_auth_role() IN ('teacher', 'admin'));

-- MATERIAL_CHUNKS
DROP POLICY IF EXISTS "Material Chunks SELECT policy" ON public.material_chunks;
DROP POLICY IF EXISTS "Material Chunks WRITE policy" ON public.material_chunks;

CREATE POLICY "Material Chunks SELECT policy" ON public.material_chunks FOR SELECT USING (TRUE);
CREATE POLICY "Material Chunks WRITE policy" ON public.material_chunks FOR ALL USING (get_auth_role() IN ('teacher', 'admin'));

-- RECOMMENDATIONS
DROP POLICY IF EXISTS "Officers view own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Recommendations SELECT policy" ON public.recommendations;
DROP POLICY IF EXISTS "Recommendations WRITE policy" ON public.recommendations;

CREATE POLICY "Recommendations SELECT policy" ON public.recommendations FOR SELECT
  USING (user_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Recommendations WRITE policy" ON public.recommendations FOR ALL
  USING (user_id = auth.uid() OR get_auth_role() = 'admin');

-- LEARNING_PATHS
DROP POLICY IF EXISTS "Officers view own learning path" ON public.learning_paths;
DROP POLICY IF EXISTS "Learning Paths SELECT policy" ON public.learning_paths;
DROP POLICY IF EXISTS "Learning Paths WRITE policy" ON public.learning_paths;

CREATE POLICY "Learning Paths SELECT policy" ON public.learning_paths FOR SELECT
  USING (user_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Learning Paths WRITE policy" ON public.learning_paths FOR ALL
  USING (user_id = auth.uid() OR get_auth_role() = 'admin');

-- IGOT_COURSES
DROP POLICY IF EXISTS "iGoT Courses SELECT policy" ON public.igot_courses;
DROP POLICY IF EXISTS "iGoT Courses WRITE policy" ON public.igot_courses;

CREATE POLICY "iGoT Courses SELECT policy" ON public.igot_courses FOR SELECT USING (TRUE);
CREATE POLICY "iGoT Courses WRITE policy" ON public.igot_courses FOR ALL USING (get_auth_role() = 'admin');

-- NSSTA_PROGRAMMES
DROP POLICY IF EXISTS "NSSTA Catalog SELECT policy" ON public.nssta_programmes;
DROP POLICY IF EXISTS "NSSTA Catalog WRITE policy" ON public.nssta_programmes;

CREATE POLICY "NSSTA Catalog SELECT policy" ON public.nssta_programmes FOR SELECT USING (TRUE);
CREATE POLICY "NSSTA Catalog WRITE policy" ON public.nssta_programmes FOR ALL USING (get_auth_role() = 'admin');
