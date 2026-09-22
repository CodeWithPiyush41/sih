/**
 * PROTOTYPE & DEVELOPMENT DEMO DATA MODULE
 * 
 * IMPORTANT:
 * This file contains isolated, clearly labelled prototype records for SIH26101 UI evaluation.
 * Do NOT present this data as verified official Government statistics or live production data.
 * When real Supabase database records exist, components MUST render live database data.
 */

export interface DemoOfficerProfile {
  id: string;
  name: string;
  designation: string;
  departmentMdo: string;
  yearsExperience: number;
  location: string;
  isPrototype: boolean;
}

export const PROTOTYPE_DEMO_OFFICER: DemoOfficerProfile = {
  id: 'proto-off-01',
  name: 'Rahul Sharma',
  designation: 'Statistical Officer',
  departmentMdo: 'Ministry of Statistics and Programme Implementation (MoSPI)',
  yearsExperience: 6,
  location: 'New Delhi',
  isPrototype: true,
};

export const PROTOTYPE_DEMO_COMPETENCY_SCORES = [
  { topicId: 'comp-1', topicName: 'Survey Methodology', scorePercent: 78, questionsAnswered: 12, questionsCorrect: 9, status: 'mastered' },
  { topicId: 'comp-2', topicName: 'Sampling Methods', scorePercent: 52, questionsAnswered: 10, questionsCorrect: 5, status: 'developing' },
  { topicId: 'comp-4', topicName: 'Data Validation', scorePercent: 38, questionsAnswered: 10, questionsCorrect: 4, status: 'needs_practice' },
  { topicId: 'comp-5', topicName: 'Statistical Analysis', scorePercent: 64, questionsAnswered: 8, questionsCorrect: 5, status: 'developing' },
  { topicId: 'comp-6', topicName: 'Data Interpretation', scorePercent: 71, questionsAnswered: 7, questionsCorrect: 5, status: 'mastered' },
];
