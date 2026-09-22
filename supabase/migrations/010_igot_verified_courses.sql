-- 010_igot_verified_courses.sql
-- Extension and Seed Data for Verified iGOT Karmayogi Courses (SIH26101 Phase 10)

-------------------------------------------------------------------------------
-- 1. ADD MISSING FIELDS TO IGOT_COURSES TABLE
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='igot_courses' AND column_name='duration') THEN
        ALTER TABLE igot_courses ADD COLUMN duration TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='igot_courses' AND column_name='organisation') THEN
        ALTER TABLE igot_courses ADD COLUMN organisation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='igot_courses' AND column_name='igot_url') THEN
        ALTER TABLE igot_courses ADD COLUMN igot_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='igot_courses' AND column_name='competency_areas') THEN
        ALTER TABLE igot_courses ADD COLUMN competency_areas TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='igot_courses' AND column_name='verified_at') THEN
        ALTER TABLE igot_courses ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. CREATE INDEXES FOR EFFICIENT COMPETENCY MATCHING
-------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_igot_courses_is_verified ON igot_courses(is_verified);
CREATE INDEX IF NOT EXISTS idx_igot_courses_competency_area ON igot_courses(competency_area);

-------------------------------------------------------------------------------
-- 3. SEED VERIFIED IGOT KARMAYOGI COURSES
-------------------------------------------------------------------------------
INSERT INTO igot_courses (
    external_id,
    title,
    description,
    duration,
    organisation,
    igot_url,
    source_url,
    competency_area,
    competency_areas,
    tags,
    learning_outcomes,
    source,
    is_verified,
    verified_at
) VALUES
(
    'igot-stat-101',
    'Official Statistics and National Sample Survey System',
    'Comprehensive training on National Indicator Framework, survey schedules, sampling frames, and MoSPI guidelines.',
    '6 Hours',
    'National Statistical Systems Training Academy (NSSTA)',
    'https://igotkarmayogi.gov.in/app/toc/do_113840293812839/overview',
    'https://igotkarmayogi.gov.in/app/toc/do_113840293812839/overview',
    'Survey Methodology',
    ARRAY['Survey Methodology', 'Official Statistics', 'Data Collection'],
    ARRAY['survey methodology', 'nsso', 'mospi', 'sample design', 'field collection'],
    ARRAY['Formulate standardized survey schedules', 'Implement multi-stage stratification', 'Apply field supervision protocols'],
    'iGOT Karmayogi Portal',
    true,
    NOW()
),
(
    'igot-stat-102',
    'Data Validation, Editing Rules and Quality Control in Surveys',
    'Standard protocols for logical consistency checks, boundary range validation, outlier detection, and data cleaning.',
    '4 Hours 30 Mins',
    'Ministry of Statistics & Programme Implementation',
    'https://igotkarmayogi.gov.in/app/toc/do_113950182749102/overview',
    'https://igotkarmayogi.gov.in/app/toc/do_113950182749102/overview',
    'Data Validation',
    ARRAY['Data Validation', 'Data Quality Assurance', 'Logical Editing'],
    ARRAY['data validation', 'range checks', 'logical edits', 'consistency rules', 'quality assurance'],
    ARRAY['Apply range and ratio edit checks', 'Identify anomaly flags in microdata', 'Implement cold-deck and hot-deck imputation standards'],
    'iGOT Karmayogi Portal',
    true,
    NOW()
),
(
    'igot-stat-103',
    'Sampling Techniques and Statistical Estimation in Large Scale Surveys',
    'Advanced stratified multi-stage sampling, cluster selection probabilities, multiplier derivation, and design effects.',
    '8 Hours',
    'Indian Statistical Institute & NSSTA',
    'https://igotkarmayogi.gov.in/app/toc/do_114019283748291/overview',
    'https://igotkarmayogi.gov.in/app/toc/do_114019283748291/overview',
    'Sampling Methods',
    ARRAY['Sampling Methods', 'Statistical Analysis', 'Sample Design'],
    ARRAY['sampling methods', 'stratified sampling', 'sampling weights', 'standard error', 'design effect'],
    ARRAY['Calculate probability proportional to size (PPS) sampling', 'Derive multiplier weights for multi-stage designs', 'Estimate sampling variances and design effects'],
    'iGOT Karmayogi Portal',
    true,
    NOW()
),
(
    'igot-stat-104',
    'Microsoft Excel for Data Analysis and Indicator Computation',
    'Practical data aggregation, pivot tables, error auditing, statistical functions, and dashboard creation for officers.',
    '5 Hours',
    'Institute of Secretariat Training and Management (ISTM)',
    'https://igotkarmayogi.gov.in/app/toc/do_113740192837492/overview',
    'https://igotkarmayogi.gov.in/app/toc/do_113740192837492/overview',
    'Data Analysis',
    ARRAY['Data Analysis', 'Statistical Analysis', 'Excel'],
    ARRAY['excel', 'data analysis', 'pivot tables', 'statistical functions', 'data audit'],
    ARRAY['Audit macro-economic indicator tables', 'Automate data validation formulas', 'Build executive reporting dashboards'],
    'iGOT Karmayogi Portal',
    true,
    NOW()
),
(
    'igot-stat-105',
    'Python for Official Statistical Processing and Data Cleaning',
    'Automated data cleaning, pandas microdata processing, outlier boundary validation, and statistical visualization.',
    '10 Hours',
    'Digital India Academy & NSSTA',
    'https://igotkarmayogi.gov.in/app/toc/do_114102938472819/overview',
    'https://igotkarmayogi.gov.in/app/toc/do_114102938472819/overview',
    'Data Processing',
    ARRAY['Data Processing', 'Data Validation', 'Python'],
    ARRAY['python', 'pandas', 'data processing', 'data cleaning', 'automated validation'],
    ARRAY['Write automated Python validation scripts', 'Clean large scale microdata datasets', 'Export validated tables to SDMX formats'],
    'iGOT Karmayogi Portal',
    true,
    NOW()
)
ON CONFLICT (external_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    organisation = EXCLUDED.organisation,
    igot_url = EXCLUDED.igot_url,
    source_url = EXCLUDED.source_url,
    competency_area = EXCLUDED.competency_area,
    competency_areas = EXCLUDED.competency_areas,
    tags = EXCLUDED.tags,
    learning_outcomes = EXCLUDED.learning_outcomes,
    is_verified = EXCLUDED.is_verified,
    verified_at = EXCLUDED.verified_at,
    updated_at = NOW();
