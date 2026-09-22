import { supabase } from '@/lib/supabase/client';
import type { IGOTCourseRecord } from './types';
export type { IGOTCourseRecord };
import cleanedDataset from './igot_courses_cleaned.json';

// Pure provider-based repository accessing the 150 imported iGoT Karmayogi dataset
// Fallback loaded directly from original igot_courses_cleaned.json dataset for offline resilience
export const CLEANED_DATASET_FALLBACK: IGOTCourseRecord[] = (cleanedDataset.courses || []).map((c: any, idx: number) => ({
  id: `igot-clean-local-${idx + 1}`,
  external_id: `igot-clean-${idx + 1}`,
  course_name: c.course_name,
  duration: c.duration,
  provider: c.provider,
  summary: c.summary,
  source: 'iGoT Karmayogi',
  title: c.course_name,
  organisation: c.provider,
  description: c.summary,
  igot_url: undefined,
  source_url: undefined,
  is_verified: true,
  _skilllens_possible_domains: c._skilllens_possible_domains || [],
}));

// Backwards compatibility alias
export const VERIFIED_IGOT_CATALOG = CLEANED_DATASET_FALLBACK;

export async function fetchIGOTCourses(verifiedOnly = false): Promise<IGOTCourseRecord[]> {
  try {
    let query = supabase.from('igot_courses').select('*');
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      console.warn('[IGOT Repository] Supabase returned empty or error, returning local cleaned dataset fallback.');
      return CLEANED_DATASET_FALLBACK;
    }

    return data.map((item: any) => ({
      id: item.id,
      external_id: item.external_id,
      course_name: item.course_name || item.title,
      duration: item.duration || 'Self-paced',
      provider: item.provider || item.organisation || 'iGoT Karmayogi',
      summary: item.summary || item.description || '',
      source: item.source || 'iGoT Karmayogi',
      igot_url: item.igot_url || item.source_url || undefined,
      source_url: item.source_url || item.igot_url || undefined,
      title: item.title || item.course_name,
      organisation: item.organisation || item.provider,
      description: item.description || item.summary,
      competency_area: item.competency_area || undefined,
      competency_areas: item.competency_areas || [],
      tags: item.tags || [],
      learning_outcomes: item.learning_outcomes || [],
      is_verified: item.is_verified !== false,
      verified_at: item.verified_at || undefined,
      created_at: item.created_at || undefined,
      updated_at: item.updated_at || undefined,
    }));
  } catch (err) {
    console.warn('[IGOT Repository] Database error, using cleaned dataset fallback:', err);
    return CLEANED_DATASET_FALLBACK;
  }
}

