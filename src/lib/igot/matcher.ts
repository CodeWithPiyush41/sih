import type { IGOTCourseRecord, IGOTMatchRequest, IGOTMatchResult } from './types';
import { fetchIGOTCourses } from './repository';
import { normalizeText } from './normalizer';

// Category fallback keywords for robust gap-to-content matching
const GAP_KEYWORDS_MAP: Record<string, string[]> = {
  statistical: ['statistic', 'statistics', 'statistical', 'survey', 'sampling', 'indicator', 'data', 'gdp', 'accounting', 'analysis', 'estimation', 'audit', 'excel', 'quality control', 'six sigma'],
  technical: ['technical', 'technology', 'network', 'telecom', 'wireless', 'cyber', 'security', 'system', 'interlocking', 'python', 'sql', 'ai', 'vision', 'mining', 'bsnl', '5g', '4g', 'vpn', 'interception', 'engineering'],
  digital_governance: ['governance', 'digital', 'gem', 'e-governance', 'procurement', 'policy', 'consultation', 'public', 'gpr', 'eglc', 'legal', 'adhiniyam', 'sanhita', 'gst', 'apar', 'sparrow'],
  behavioural_managerial: ['communication', 'soft skills', 'negotiation', 'team', 'leadership', 'writing', 'storytelling', 'management', 'time management', 'change management', 'self defense', 'ethics', 'karmayogi'],
};

/**
 * Deterministic iGOT Karmayogi Course Matcher.
 * Matches priority officer competency gaps strictly against course_name + summary of imported dataset.
 */
export async function matchIGOTCourses(
  request: IGOTMatchRequest
): Promise<IGOTMatchResult[]> {
  const verifiedOnly = request.verifiedOnly !== false;
  const limit = request.limit || 5;

  const gapsToMatch: string[] = [];
  if (request.priorityGaps && request.priorityGaps.length > 0) {
    gapsToMatch.push(...request.priorityGaps);
  } else if (request.competencyGap) {
    gapsToMatch.push(request.competencyGap);
  }

  if (gapsToMatch.length === 0) {
    return [];
  }

  const catalog = await fetchIGOTCourses(verifiedOnly);
  const seenCourseIds = new Set<string>();
  const matchResults: IGOTMatchResult[] = [];

  for (const gap of gapsToMatch) {
    const normGap = normalizeText(gap);
    if (!normGap) continue;

    const gapCandidates: IGOTMatchResult[] = [];
    const gapLower = gap.toLowerCase();
    const gapWords = gapLower.split(/\W+/).filter((w) => w.length > 2);

    // Expand search keywords for broad domain gaps
    let expandedKeywords = [...gapWords];
    for (const [domainKey, keywords] of Object.entries(GAP_KEYWORDS_MAP)) {
      if (gapLower.includes(domainKey) || domainKey.includes(gapLower)) {
        expandedKeywords.push(...keywords);
      }
    }
    expandedKeywords = Array.from(new Set(expandedKeywords));

    for (const course of catalog) {
      if (seenCourseIds.has(course.id)) continue;

      const courseName = course.course_name || course.title || '';
      const summary = course.summary || course.description || '';
      const fullText = `${courseName} ${summary}`.toLowerCase();

      let score = 0;
      const matchReasons: string[] = [];
      const matchedKeywords: string[] = [];

      // 1. Direct exact phrase match in course_name (+50)
      if (courseName.toLowerCase().includes(gapLower)) {
        score += 50;
        matchReasons.push(`Course name directly contains '${gap}'`);
      }
      // 2. Direct exact phrase match in summary (+30)
      else if (summary.toLowerCase().includes(gapLower)) {
        score += 30;
        matchReasons.push(`Course summary covers '${gap}'`);
      }

      // 3. Keyword matching across course_name + summary (+10 per matched word)
      for (const kw of expandedKeywords) {
        if (fullText.includes(kw)) {
          score += 10;
          if (!matchedKeywords.includes(kw)) {
            matchedKeywords.push(kw);
          }
        }
      }

      if (matchedKeywords.length > 0 && matchReasons.length === 0) {
        matchReasons.push(`Content matches keywords: ${matchedKeywords.slice(0, 4).join(', ')}`);
      }

      if (score > 0) {
        const finalScore = Math.min(100, score);
        gapCandidates.push({
          course,
          targetGap: gap,
          matchScore: finalScore,
          matchedCompetencies: [gap],
          matchedTags: matchedKeywords,
          matchReasons,
        });
      }
    }

    // Sort candidate matches for this gap by matchScore descending
    gapCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // Pick top candidates for this gap
    for (const candidate of gapCandidates) {
      if (!seenCourseIds.has(candidate.course.id)) {
        seenCourseIds.add(candidate.course.id);
        matchResults.push(candidate);
      }
    }
  }

  // Sort overall results by matchScore descending
  matchResults.sort((a, b) => b.matchScore - a.matchScore);
  return matchResults.slice(0, limit);
}

export type { CompetencyGapInput } from './types';

export async function generateIGOTRecommendations(
  gaps: Array<{ competencyArea: string; score?: number }>
): Promise<IGOTMatchResult[]> {
  const priorityGaps = gaps.map((g) => g.competencyArea);
  return matchIGOTCourses({ priorityGaps });
}

