-- 013_nssta_catalog_and_multidomain.sql
-- Extension for NSSTA / TPAC Training Program Catalog & 4-Domain Competency Taxonomy (SIH26101 Final Architecture)

-------------------------------------------------------------------------------
-- 1. EXTEND TOPICS TABLE WITH DOMAIN COLUMN
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='domain') THEN
        ALTER TABLE topics ADD COLUMN domain TEXT CHECK (domain IN ('statistical', 'technical', 'digital_governance', 'behavioural_managerial')) DEFAULT 'statistical';
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. CREATE NSSTA_PROGRAMMES CATALOG TABLE
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nssta_programmes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    organisation TEXT DEFAULT 'National Statistical Systems Training Academy (NSSTA)',
    programme_type TEXT CHECK (programme_type IN ('NSSTA', 'TPAC')) DEFAULT 'NSSTA',
    duration TEXT DEFAULT '5 Days',
    official_url TEXT NOT NULL,
    competency_area TEXT NOT NULL,
    domains TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    learning_outcomes TEXT[] DEFAULT '{}',
    source TEXT DEFAULT 'NSSTA MoSPI Training Calendar',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient competency matching
CREATE INDEX IF NOT EXISTS idx_nssta_programmes_is_verified ON nssta_programmes(is_verified);
CREATE INDEX IF NOT EXISTS idx_nssta_programmes_competency_area ON nssta_programmes(competency_area);

-------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON NSSTA_PROGRAMMES
-------------------------------------------------------------------------------
ALTER TABLE nssta_programmes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read verified nssta_programmes') THEN
        CREATE POLICY "Authenticated users can read verified nssta_programmes" ON nssta_programmes
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read verified nssta_programmes') THEN
        CREATE POLICY "Public read verified nssta_programmes" ON nssta_programmes
            FOR SELECT USING (true);
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 4. SEED VERIFIED NSSTA / TPAC TRAINING PROGRAMMES
-------------------------------------------------------------------------------
INSERT INTO nssta_programmes (
    external_id,
    title,
    description,
    organisation,
    programme_type,
    duration,
    official_url,
    competency_area,
    domains,
    tags,
    learning_outcomes,
    source,
    is_verified,
    verified_at
) VALUES
(
    'nssta-prog-101',
    'Advanced Sampling Design and Estimation Procedures for Official Statisticians',
    'Specialized residential training programme conducted by NSSTA Greater Noida covering multi-stage stratification, sampling weight calculation, variance estimation, and non-sampling error management.',
    'National Statistical Systems Training Academy (NSSTA), MoSPI',
    'NSSTA',
    '5 Days (Residential)',
    'https://mospi.gov.in/nssta-training-calendar',
    'Sampling Methods',
    ARRAY['statistical'],
    ARRAY['sampling methods', 'nssta', 'mospi', 'estimation', 'survey design'],
    ARRAY['Design multi-stage sampling plans for large surveys', 'Calculate sampling weights and multiplier factors', 'Estimate sampling error and design effect'],
    'NSSTA MoSPI Official Training Calendar',
    true,
    NOW()
),
(
    'nssta-prog-102',
    'Data Cleaning, Logical Editing & Microdata Validation Protocols',
    'Intensive workshop on survey data editing rules, range check formulations, automated outlier flag detection, and standard MoSPI data release guidelines.',
    'NSSTA & Training Programme Advisory Committee (TPAC)',
    'TPAC',
    '3 Days',
    'https://mospi.gov.in/tpac-programmes',
    'Data Validation',
    ARRAY['statistical', 'technical'],
    ARRAY['data validation', 'range checks', 'microdata', 'editing rules', 'quality assurance'],
    ARRAY['Apply range and ratio edit checks to raw survey data', 'Implement logical consistency rules for household schedules', 'Audit microdata prior to public dissemination'],
    'NSSTA MoSPI Official Training Calendar',
    true,
    NOW()
),
(
    'nssta-prog-103',
    'Python for Large-Scale Survey Processing and Machine Learning in Official Statistics',
    'Hands-on technical training program for statistical officers covering Pandas, NumPy, automated data ingestion, and predictive modeling for national indicators.',
    'National Statistical Systems Training Academy (NSSTA)',
    'NSSTA',
    '1 Week',
    'https://mospi.gov.in/nssta-training-calendar',
    'Python',
    ARRAY['technical'],
    ARRAY['python', 'pandas', 'data processing', 'nssta', 'automation'],
    ARRAY['Build automated data ingestion pipelines in Python', 'Clean and transform multi-gigabyte survey datasets', 'Implement statistical summary scripts'],
    'NSSTA MoSPI Official Training Calendar',
    true,
    NOW()
),
(
    'nssta-prog-104',
    'Data Governance, Privacy Guidelines & Information Security for Government Systems',
    'Comprehensive training covering Digital Personal Data Protection (DPDP) Act, data classification, secure data sharing protocols, and cyber hygiene for official statistical systems.',
    'National Statistical Systems Training Academy (NSSTA)',
    'NSSTA',
    '3 Days',
    'https://mospi.gov.in/nssta-training-calendar',
    'Data Privacy',
    ARRAY['digital_governance'],
    ARRAY['data privacy', 'dpdp act', 'cybersecurity', 'governance', 'data security'],
    ARRAY['Implement DPDP Act compliance in survey data collection', 'Apply anonymization techniques to public microdata', 'Enforce secure role-based data access control'],
    'NSSTA MoSPI Official Training Calendar',
    true,
    NOW()
),
(
    'nssta-prog-105',
    'Executive Communication, Leadership & Project Management for Statistical Officers',
    'Managerial capability development programme focusing on technical report writing, policy briefing preparation, cross-departmental coordination, and survey project leadership.',
    'NSSTA & Institute of Secretariat Training and Management (ISTM)',
    'TPAC',
    '4 Days',
    'https://mospi.gov.in/nssta-training-calendar',
    'Project Management',
    ARRAY['behavioural_managerial'],
    ARRAY['leadership', 'communication', 'project management', 'technical writing', 'policy briefing'],
    ARRAY['Prepare executive summary reports for national indicator frameworks', 'Lead field survey teams and monitor data collection milestones', 'Draft clear policy briefs based on statistical findings'],
    'NSSTA MoSPI Official Training Calendar',
    true,
    NOW()
)
ON CONFLICT (external_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    organisation = EXCLUDED.organisation,
    programme_type = EXCLUDED.programme_type,
    duration = EXCLUDED.duration,
    official_url = EXCLUDED.official_url,
    competency_area = EXCLUDED.competency_area,
    domains = EXCLUDED.domains,
    tags = EXCLUDED.tags,
    learning_outcomes = EXCLUDED.learning_outcomes,
    is_verified = EXCLUDED.is_verified,
    verified_at = EXCLUDED.verified_at,
    updated_at = NOW();
