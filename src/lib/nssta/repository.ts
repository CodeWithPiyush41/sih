import { supabase } from '@/lib/supabase/client';

export interface NSSTAProgrammeRecord {
  id: string;
  external_id: string;
  title: string;
  description: string;
  organisation: string;
  programme_type: 'NSSTA' | 'TPAC';
  duration: string;
  official_url: string;
  competency_area: string;
  domains: string[];
  tags: string[];
  learning_outcomes: string[];
  source: string;
  is_verified: boolean;
  verified_at?: string;
}

export const VERIFIED_NSSTA_CATALOG: NSSTAProgrammeRecord[] = [
  {
    id: 'nssta-101',
    external_id: 'nssta-prog-101',
    title: 'Advanced Sampling Design and Estimation Procedures for Official Statisticians',
    description: 'Specialized residential training programme conducted by NSSTA Greater Noida covering multi-stage stratification, sampling weight calculation, variance estimation, and non-sampling error management.',
    organisation: 'National Statistical Systems Training Academy (NSSTA), MoSPI',
    programme_type: 'NSSTA',
    duration: '5 Days (Residential)',
    official_url: 'https://mospi.gov.in/nssta-training-calendar',
    competency_area: 'Sampling Methods',
    domains: ['statistical'],
    tags: ['sampling methods', 'nssta', 'mospi', 'estimation', 'survey design'],
    learning_outcomes: ['Design multi-stage sampling plans for large surveys', 'Calculate sampling weights and multiplier factors', 'Estimate sampling error and design effect'],
    source: 'NSSTA MoSPI Official Training Calendar',
    is_verified: true,
  },
  {
    id: 'nssta-102',
    external_id: 'nssta-prog-102',
    title: 'Data Cleaning, Logical Editing & Microdata Validation Protocols',
    description: 'Intensive workshop on survey data editing rules, range check formulations, automated outlier flag detection, and standard MoSPI data release guidelines.',
    organisation: 'NSSTA & Training Programme Advisory Committee (TPAC)',
    programme_type: 'TPAC',
    duration: '3 Days',
    official_url: 'https://mospi.gov.in/tpac-programmes',
    competency_area: 'Data Validation',
    domains: ['statistical', 'technical'],
    tags: ['data validation', 'range checks', 'microdata', 'editing rules', 'quality assurance'],
    learning_outcomes: ['Apply range and ratio edit checks to raw survey data', 'Implement logical consistency rules for household schedules', 'Audit microdata prior to public dissemination'],
    source: 'NSSTA MoSPI Official Training Calendar',
    is_verified: true,
  },
  {
    id: 'nssta-103',
    external_id: 'nssta-prog-103',
    title: 'Python for Large-Scale Survey Processing and Machine Learning in Official Statistics',
    description: 'Hands-on technical training program for statistical officers covering Pandas, NumPy, automated data ingestion, and predictive modeling for national indicators.',
    organisation: 'National Statistical Systems Training Academy (NSSTA)',
    programme_type: 'NSSTA',
    duration: '1 Week',
    official_url: 'https://mospi.gov.in/nssta-training-calendar',
    competency_area: 'Python',
    domains: ['technical'],
    tags: ['python', 'pandas', 'data processing', 'nssta', 'automation'],
    learning_outcomes: ['Build automated data ingestion pipelines in Python', 'Clean and transform multi-gigabyte survey datasets', 'Implement statistical summary scripts'],
    source: 'NSSTA MoSPI Official Training Calendar',
    is_verified: true,
  },
  {
    id: 'nssta-104',
    external_id: 'nssta-prog-104',
    title: 'Data Governance, Privacy Guidelines & Information Security for Government Systems',
    description: 'Comprehensive training covering Digital Personal Data Protection (DPDP) Act, data classification, secure data sharing protocols, and cyber hygiene for official statistical systems.',
    organisation: 'National Statistical Systems Training Academy (NSSTA)',
    programme_type: 'NSSTA',
    duration: '3 Days',
    official_url: 'https://mospi.gov.in/nssta-training-calendar',
    competency_area: 'Data Privacy',
    domains: ['digital_governance'],
    tags: ['data privacy', 'dpdp act', 'cybersecurity', 'governance', 'data security'],
    learning_outcomes: ['Implement DPDP Act compliance in survey data collection', 'Apply anonymization techniques to public microdata', 'Enforce secure role-based data access control'],
    source: 'NSSTA MoSPI Official Training Calendar',
    is_verified: true,
  },
  {
    id: 'nssta-105',
    external_id: 'nssta-prog-105',
    title: 'Executive Communication, Leadership & Project Management for Statistical Officers',
    description: 'Managerial capability development programme focusing on technical report writing, policy briefing preparation, cross-departmental coordination, and survey project leadership.',
    organisation: 'NSSTA & Institute of Secretariat Training and Management (ISTM)',
    programme_type: 'TPAC',
    duration: '4 Days',
    official_url: 'https://mospi.gov.in/nssta-training-calendar',
    competency_area: 'Project Management',
    domains: ['behavioural_managerial'],
    tags: ['leadership', 'communication', 'project management', 'technical writing', 'policy briefing'],
    learning_outcomes: ['Prepare executive summary reports for national indicator frameworks', 'Lead field survey teams and monitor data collection milestones', 'Draft clear policy briefs based on statistical findings'],
    source: 'NSSTA MoSPI Official Training Calendar',
    is_verified: true,
  },
];

export async function fetchNSSTAProgrammes(verifiedOnly = true): Promise<NSSTAProgrammeRecord[]> {
  try {
    let query = supabase.from('nssta_programmes').select('*');
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return VERIFIED_NSSTA_CATALOG.filter(p => !verifiedOnly || p.is_verified);
    }

    return data.map((item: any) => ({
      id: item.id,
      external_id: item.external_id,
      title: item.title,
      description: item.description || '',
      organisation: item.organisation || 'NSSTA MoSPI',
      programme_type: item.programme_type || 'NSSTA',
      duration: item.duration || 'Flexible',
      official_url: item.official_url || 'https://mospi.gov.in',
      competency_area: item.competency_area,
      domains: item.domains || [],
      tags: item.tags || [],
      learning_outcomes: item.learning_outcomes || [],
      source: item.source || 'NSSTA MoSPI Training Calendar',
      is_verified: Boolean(item.is_verified),
      verified_at: item.verified_at,
    }));
  } catch (err) {
    console.warn('[NSSTA Repository] Using static catalog fallback:', err);
    return VERIFIED_NSSTA_CATALOG.filter(p => !verifiedOnly || p.is_verified);
  }
}
