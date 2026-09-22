-- 006_sih26101_pivot.sql
-- Idempotent Migration for SIH26101 Domain Pivot

-------------------------------------------------------------------------------
-- 1. EXTEND PROFILES FOR OFFICER METADATA (SAFE ADD COLUMNS)
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='designation') THEN
        ALTER TABLE profiles ADD COLUMN designation TEXT DEFAULT 'Statistical Officer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department_mdo') THEN
        ALTER TABLE profiles ADD COLUMN department_mdo TEXT DEFAULT 'Ministry of Statistics and Programme Implementation';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='years_experience') THEN
        ALTER TABLE profiles ADD COLUMN years_experience INTEGER DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location') THEN
        ALTER TABLE profiles ADD COLUMN location TEXT DEFAULT 'New Delhi';
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. SERVER-SIDE EMAIL DOMAIN CHECK TRIGGER
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_email_domain()
RETURNS trigger AS $$
DECLARE
    allowed_domain TEXT := 'poornima.org';
    user_domain TEXT;
BEGIN
    user_domain := split_part(new.email, '@', 2);
    IF lower(user_domain) <> allowed_domain THEN
        RAISE EXCEPTION 'Registration restricted to official @% email addresses.', allowed_domain;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS enforce_email_domain_trigger ON auth.users;
CREATE TRIGGER enforce_email_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_user_email_domain();

-------------------------------------------------------------------------------
-- 3. IGOT COURSES CATALOG TABLE (PROTOTYPE & VERIFIED CATALOG STORAGE)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS igot_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    competency_area TEXT NOT NULL,
    competency_type TEXT DEFAULT 'domain',
    tags TEXT[] DEFAULT '{}',
    learning_outcomes TEXT[] DEFAULT '{}',
    source_url TEXT NOT NULL,
    source TEXT DEFAULT 'iGOT Karmayogi (Prototype Catalog)',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS safely
ALTER TABLE igot_courses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read igot_courses') THEN
        CREATE POLICY "Authenticated users can read igot_courses" ON igot_courses
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage igot_courses') THEN
        CREATE POLICY "Admins can manage igot_courses" ON igot_courses
            FOR ALL USING (public.get_auth_role() = 'admin');
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 4. RECOMMENDATIONS TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    competency_id TEXT,
    competency_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('internal', 'igot')) DEFAULT 'igot',
    external_resource_id TEXT,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    source_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('recommended', 'in_progress', 'completed', 'dismissed')) DEFAULT 'recommended',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS safely
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own recommendations') THEN
        CREATE POLICY "Users manage own recommendations" ON recommendations
            FOR ALL USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all recommendations') THEN
        CREATE POLICY "Admins read all recommendations" ON recommendations
            FOR SELECT USING (public.get_auth_role() = 'admin');
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 5. SEED INITIAL ADMIN USER & PROFILES (IF NOT EXISTS IN AUTH)
-- Note: Admin account admin@poornima.org should be created via Auth API or Supabase Console.
-- This helper SQL ensures that if profile is created, its role is set to 'admin'.
-------------------------------------------------------------------------------
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@poornima.org';
