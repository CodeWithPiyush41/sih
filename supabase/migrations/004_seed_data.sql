-- 004_seed_data.sql
-- Statistical Training Seed Data (SIH26101 Domain)

INSERT INTO subjects (id, name, code, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Official Survey Methodology', 'STAT-101', 'Fundamentals of official socio-economic sample surveys'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Data Validation & Quality Assurance', 'STAT-102', 'Data editing, range validation, and quality standards'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Statistical Analysis & Dissemination', 'STAT-103', 'Statistical estimation, indicator framework, and data dissemination')
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (id, name, code, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Official Statistical System Training', 'OSS-PROG', 'Training Programme for Statistical Officers')
ON CONFLICT (code) DO NOTHING;

-- Insert Topics for Official Survey Methodology
INSERT INTO topics (id, subject_id, name, description) VALUES
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000', 'Survey Methodology', 'Principles of official sample survey design'),
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000', 'Sampling Methods', 'Stratified multi-stage sampling protocols'),
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000', 'Data Collection', 'Field data collection and enumerator guidelines'),
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000', 'Data Validation', 'Logical consistency checks and range validation'),
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000', 'Statistical Analysis', 'Indicator estimation and data interpretation');
