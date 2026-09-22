import { matchIGOTCourses, type CompetencyGapInput } from './matcher';
import type { IGOTMatchResult } from './types';

export async function fetchUserIGOTRecommendations(
  _userId: string,
  currentGaps: CompetencyGapInput[]
): Promise<IGOTMatchResult[]> {
  const priorityGaps = currentGaps.map((g) => g.competencyArea);
  return matchIGOTCourses({ priorityGaps, limit: 5 });
}
