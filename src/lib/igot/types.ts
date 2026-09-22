export interface IGOTCourseRecord {
  id: string;
  external_id?: string;
  course_name: string;
  duration: string;
  provider: string;
  summary: string;
  source: string;
  igot_url?: string;
  source_url?: string;
  title?: string;
  organisation?: string;
  description?: string;
  competency_area?: string;
  competency_areas?: string[];
  tags?: string[];
  learning_outcomes?: string[];
  is_verified?: boolean;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
  _skilllens_possible_domains?: string[];
}

export interface IGOTMatchRequest {
  competencyGap?: string;
  priorityGaps?: string[];
  limit?: number;
  verifiedOnly?: boolean;
}

export interface IGOTMatchResult {
  course: IGOTCourseRecord;
  targetGap: string;
  matchScore: number;
  matchedCompetencies: string[];
  matchedTags: string[];
  matchReasons: string[];
}
export interface CompetencyGapInput {
  competencyArea: string;
  score?: number;
}

export type IGOTCourse = IGOTCourseRecord;
export type IGOTRecommendation = IGOTMatchResult;
