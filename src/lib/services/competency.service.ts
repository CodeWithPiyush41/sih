import { supabase } from '@/lib/supabase/client';
import { fetchIGOTCourses, IGOTCourseRecord } from '@/lib/igot/repository';
import { matchIGOTCourses } from '@/lib/igot/matcher';
import { fetchNSSTAProgrammes, NSSTAProgrammeRecord } from '@/lib/nssta/repository';


export type CompetencyDomainKey = 'statistical' | 'technical' | 'digital_governance' | 'behavioural_managerial';

export interface CompetencyDomainMeta {
  key: CompetencyDomainKey;
  title: string;
  description: string;
  icon: string;
}

export const FOUR_COMPETENCY_DOMAINS: CompetencyDomainMeta[] = [
  {
    key: 'statistical',
    title: 'Statistical Competency',
    description: 'Survey methodology, sampling techniques, data quality, national indicator frameworks',
    icon: 'BarChart2',
  },
  {
    key: 'technical',
    title: 'Technical & Data Science',
    description: 'Python processing, R statistical computing, SQL microdata querying, visualization',
    icon: 'Code',
  },
  {
    key: 'digital_governance',
    title: 'Digital Governance & Security',
    description: 'DPDP Act compliance, cybersecurity hygiene, SDMX data standards, DPI architecture',
    icon: 'Shield',
  },
  {
    key: 'behavioural_managerial',
    title: 'Behavioural & Managerial',
    description: 'Technical report writing, executive communication, field team leadership, ethics',
    icon: 'Users',
  },
];

export interface CompetencyTopicScore {
  topicId: string;
  topicName: string;
  domain: CompetencyDomainKey;
  scorePercent: number | null; // null if unassessed
  statusTier: 'Proficient' | 'Developing' | 'Needs Development' | 'Not yet evaluated';
  evaluatedCount: number;
  lastEvaluatedAt?: string;
  evidenceSnippet?: string;
}

export interface DomainOverview {
  domain: CompetencyDomainKey;
  title: string;
  averagePercent: number | null;
  statusTier: 'Proficient' | 'Developing' | 'Needs Development' | 'Not yet evaluated';
  evaluatedTopicsCount: number;
  totalTopicsCount: number;
  topics: CompetencyTopicScore[];
}

export interface DualRecommendationResult {
  priorityGap: CompetencyTopicScore | null;
  igotCourse: IGOTCourseRecord | null;
  nsstaProgramme: NSSTAProgrammeRecord | null;
  igotMessage: string;
  nsstaMessage: string;
  igot?: Array<{ id: string; title: string; provider: string; url?: string; summary?: string }>;
  nssta?: Array<{ id: string; title: string; provider: string; url?: string }>;
}

export interface CompetencyProfileOverview {
  overallScorePercent: number | null;
  overallStatusTier: 'Proficient' | 'Developing' | 'Needs Development' | 'Not yet evaluated';
  assessedTopicsCount: number;
  totalTopicsCount: number;
  domains: DomainOverview[];
  priorityGap: CompetencyTopicScore | null;
  dualRecommendations: DualRecommendationResult;
  assessmentAttemptsCount: number;
}

/**
 * Shared Tier Calculator
 */
export function calculateStatusTier(
  percent: number | null
): 'Proficient' | 'Developing' | 'Needs Development' | 'Not yet evaluated' {
  if (percent === null || percent === undefined) return 'Not yet evaluated';
  if (percent >= 75) return 'Proficient';
  if (percent >= 50) return 'Developing';
  return 'Needs Development';
}

/**
 * Shared Single-Source-of-Truth Competency Evaluation Service
 */
export const CompetencyService = {
  async getOfficerCompetencyProfile(userId?: string): Promise<CompetencyProfileOverview> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) targetUserId = user.id;
      }

      // 1. Fetch user topic scores from topic_scores joined with topics
      let dbScores: any[] = [];
      let attemptsCount = 0;

      if (targetUserId) {
        const { data: scoresData } = await supabase
          .from('topic_scores')
          .select('*, topics(*)')
          .eq('student_id', targetUserId)
          .order('created_at', { ascending: false });

        if (scoresData) dbScores = scoresData;

        const { count } = await supabase
          .from('assessment_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', targetUserId);
        
        attemptsCount = count || 0;
      }

      // Default Taxonomy across 4 domains
      const taxonomyTopics: Array<{ name: string; domain: CompetencyDomainKey; defaultScore?: number }> = [
        // Statistical
        { name: 'Survey Methodology', domain: 'statistical' },
        { name: 'Sampling Methods', domain: 'statistical' },
        { name: 'Data Validation', domain: 'statistical' },
        { name: 'National Indicator Framework', domain: 'statistical' },
        // Technical
        { name: 'Python', domain: 'technical' },
        { name: 'Data Analysis', domain: 'technical' },
        { name: 'SQL & Database Querying', domain: 'technical' },
        // Digital Governance
        { name: 'Data Privacy', domain: 'digital_governance' },
        { name: 'Cybersecurity Hygiene', domain: 'digital_governance' },
        // Behavioural / Managerial
        { name: 'Project Management', domain: 'behavioural_managerial' },
        { name: 'Executive Communication', domain: 'behavioural_managerial' },
      ];

      // Helper function to infer domain for unlisted or custom topics
      const inferDomainForTopic = (name: string): CompetencyDomainKey => {
        const lower = name.toLowerCase();
        if (lower.includes('python') || lower.includes('analysis') || lower.includes('sql') || lower.includes('database') || lower.includes('code') || lower.includes('tech') || lower.includes('programming') || lower.includes('data science')) {
          return 'technical';
        }
        if (lower.includes('privacy') || lower.includes('cyber') || lower.includes('security') || lower.includes('governance') || lower.includes('dpdp') || lower.includes('digital') || lower.includes('dpi')) {
          return 'digital_governance';
        }
        if (lower.includes('management') || lower.includes('communication') || lower.includes('leadership') || lower.includes('executive') || lower.includes('report') || lower.includes('behavioural')) {
          return 'behavioural_managerial';
        }
        return 'statistical';
      };

      // Map scores
      const topicMap: Record<string, CompetencyTopicScore> = {};

      taxonomyTopics.forEach((t) => {
        // Find existing score
        const found = dbScores.find((s) => s.topics?.name === t.name || s.topic_id === t.name);
        const scorePercent = found ? Math.round(Number(found.percentage)) : null;

        topicMap[t.name] = {
          topicId: t.name,
          topicName: t.name,
          domain: t.domain,
          scorePercent,
          statusTier: calculateStatusTier(scorePercent),
          evaluatedCount: found ? 1 : 0,
          lastEvaluatedAt: found?.created_at,
          evidenceSnippet: found ? `Verified by evaluation attempt (${found.percentage}%)` : undefined,
        };
      });

      // Also map any dbScores for topics not listed in static taxonomyTopics
      dbScores.forEach((s) => {
        const tName = s.topics?.name || s.topic_id || 'General Competency';
        if (tName && !topicMap[tName]) {
          const scorePercent = Math.round(Number(s.percentage));
          const domain = inferDomainForTopic(tName);
          topicMap[tName] = {
            topicId: tName,
            topicName: tName,
            domain,
            scorePercent,
            statusTier: calculateStatusTier(scorePercent),
            evaluatedCount: 1,
            lastEvaluatedAt: s.created_at,
            evidenceSnippet: `Verified by evaluation attempt (${s.percentage}%)`,
          };
        }
      });

      // Group into 4 Domains
      const domainOverviews: DomainOverview[] = FOUR_COMPETENCY_DOMAINS.map((dom) => {
        const domTopics = Object.values(topicMap).filter((t) => t.domain === dom.key);
        const assessed = domTopics.filter((t) => t.scorePercent !== null);

        let averagePercent: number | null = null;
        if (assessed.length > 0) {
          const sum = assessed.reduce((acc, curr) => acc + (curr.scorePercent || 0), 0);
          averagePercent = Math.round(sum / assessed.length);
        }

        return {
          domain: dom.key,
          title: dom.title,
          averagePercent,
          statusTier: calculateStatusTier(averagePercent),
          evaluatedTopicsCount: assessed.length,
          totalTopicsCount: domTopics.length,
          topics: domTopics,
        };
      });

      // Overall Score Calculation
      const allAssessed = Object.values(topicMap).filter((t) => t.scorePercent !== null);
      let overallScorePercent: number | null = null;
      if (allAssessed.length > 0) {
        const sum = allAssessed.reduce((acc, curr) => acc + (curr.scorePercent || 0), 0);
        overallScorePercent = Math.round(sum / allAssessed.length);
      }

      // Priority Gap (Lowest score below 75%)
      const gaps = allAssessed
        .filter((t) => t.scorePercent !== null && t.scorePercent < 75)
        .sort((a, b) => (a.scorePercent || 0) - (b.scorePercent || 0));
      
      const priorityGap = gaps.length > 0 ? gaps[0] : null;

      // Dual Recommendations Matcher
      const nsstaCatalog = await fetchNSSTAProgrammes(true);

      let matchedIGOT: IGOTCourseRecord | null = null;
      let matchedNSSTA: NSSTAProgrammeRecord | null = null;

      if (priorityGap) {
        const matches = await matchIGOTCourses({ competencyGap: priorityGap.topicName, limit: 1 });
        if (matches && matches.length > 0) {
          matchedIGOT = matches[0].course;
        } else {
          // Fallback domain search
          const domainMatches = await matchIGOTCourses({ competencyGap: priorityGap.domain, limit: 1 });
          if (domainMatches && domainMatches.length > 0) {
            matchedIGOT = domainMatches[0].course;
          }
        }

        const gapNameLower = priorityGap.topicName.toLowerCase();
        matchedNSSTA = nsstaCatalog.find((p) =>
          p.competency_area.toLowerCase().includes(gapNameLower) ||
          p.domains.includes(priorityGap.domain) ||
          p.tags.some((tg) => gapNameLower.includes(tg.toLowerCase())) ||
          p.title.toLowerCase().includes(gapNameLower)
        ) || nsstaCatalog[0] || null;
      } else {
        // Fallback for officers prior to baseline evaluation
        const defaultMatches = await matchIGOTCourses({ priorityGaps: ['Statistical Methodology', 'Data Validation', 'Official Statistics'], limit: 1 });
        if (defaultMatches && defaultMatches.length > 0) {
          matchedIGOT = defaultMatches[0].course;
        }
        matchedNSSTA = nsstaCatalog[0] || null;
      }

      const dualRecommendations: DualRecommendationResult = {
        priorityGap,
        igotCourse: matchedIGOT,
        nsstaProgramme: matchedNSSTA,
        igotMessage: matchedIGOT ? '' : 'No matching iGoT course found in the current catalog.',
        nsstaMessage: matchedNSSTA ? '' : 'No verified NSSTA / TPAC programme mapped yet.',
        igot: matchedIGOT ? [{
          id: matchedIGOT.id,
          title: matchedIGOT.course_name || matchedIGOT.title || '',
          provider: matchedIGOT.provider || matchedIGOT.organisation || 'iGoT Karmayogi',
          url: matchedIGOT.igot_url || matchedIGOT.source_url,
          summary: matchedIGOT.summary || matchedIGOT.description,
        }] : [],
        nssta: matchedNSSTA ? [{
          id: matchedNSSTA.id,
          title: matchedNSSTA.title,
          provider: matchedNSSTA.organisation || 'NSSTA',
          url: matchedNSSTA.official_url,
        }] : [],
      };


      return {
        overallScorePercent,
        overallStatusTier: calculateStatusTier(overallScorePercent),
        assessedTopicsCount: allAssessed.length,
        totalTopicsCount: Object.keys(topicMap).length,
        domains: domainOverviews,
        priorityGap,
        dualRecommendations,
        assessmentAttemptsCount: attemptsCount,
      };
    } catch (err) {
      console.error('[CompetencyService] Profile evaluation error:', err);
      return {
        overallScorePercent: null,
        overallStatusTier: 'Not yet evaluated',
        assessedTopicsCount: 0,
        totalTopicsCount: 11,
        domains: FOUR_COMPETENCY_DOMAINS.map((dom) => ({
          domain: dom.key,
          title: dom.title,
          averagePercent: null,
          statusTier: 'Not yet evaluated',
          evaluatedTopicsCount: 0,
          totalTopicsCount: 3,
          topics: [],
        })),
        priorityGap: null,
        dualRecommendations: {
          priorityGap: null,
          igotCourse: null,
          nsstaProgramme: null,
          igotMessage: 'No verified iGOT resource mapped yet.',
          nsstaMessage: 'No verified NSSTA / TPAC programme mapped yet.',
        },
        assessmentAttemptsCount: 0,
      };
    }
  },
};
