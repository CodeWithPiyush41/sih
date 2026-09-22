import type {
  Course,
  Topic,
  Question,
  Assessment,
  Attempt,
  TopicScore,
  StudentCourseSummary,
} from '@/lib/types';
import { computeRecommendedReviewOrder } from '@/lib/recommend';

export const mockUsers = [
  { id: 't1', name: 'Dr. Rajesh Kumar', role: 'teacher' as const },
  { id: 's1', name: 'Rahul Sharma', role: 'student' as const },
  { id: 's2', name: 'Priya Verma', role: 'student' as const },
  { id: 's3', name: 'Amit Patel', role: 'student' as const },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    teacherId: 't1',
    name: 'Official Statistical Systems & Survey Methodology',
    description: 'Comprehensive training on survey design, sampling frames, field operations, and data validation protocols.',
    createdAt: '2025-08-15T10:00:00Z',
  },
  {
    id: 'c2',
    teacherId: 't1',
    name: 'Advanced Data Validation & Quality Assurance',
    description: 'Methods for error localization, logical editing rules, imputation algorithms, and data dissemination standards.',
    createdAt: '2025-09-01T10:00:00Z',
  },
];

export const mockTopics: Topic[] = [
  // Course 1 topics
  { id: 't1', courseId: 'c1', name: 'Survey Methodology', prerequisiteTopicIds: [] },
  { id: 't2', courseId: 'c1', name: 'Sampling Methods', prerequisiteTopicIds: ['t1'] },
  { id: 't3', courseId: 'c1', name: 'Data Collection', prerequisiteTopicIds: ['t1', 't2'] },
  { id: 't4', courseId: 'c1', name: 'Data Validation', prerequisiteTopicIds: ['t1', 't3'] },
  { id: 't5', courseId: 'c1', name: 'Statistical Analysis', prerequisiteTopicIds: ['t4'] },
  { id: 't6', courseId: 'c1', name: 'Data Interpretation', prerequisiteTopicIds: ['t2', 't3'] },
  { id: 't7', courseId: 'c1', name: 'Data Dissemination', prerequisiteTopicIds: ['t4', 't6'] },
  // Course 2 topics
  { id: 't8', courseId: 'c2', name: 'Logical Consistency Editing', prerequisiteTopicIds: [] },
  { id: 't9', courseId: 'c2', name: 'Outlier Detection Bounds', prerequisiteTopicIds: ['t8'] },
  { id: 't10', courseId: 'c2', name: 'Imputation Algorithms', prerequisiteTopicIds: ['t9'] },
  { id: 't11', courseId: 'c2', name: 'SDMX Metadata Standards', prerequisiteTopicIds: ['t10'] },
];

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    courseId: 'c1',
    topicId: 't1',
    prompt: 'Which document establishes the standard framework for national sample surveys in India?',
    options: [
      { id: 'a', text: 'State Statistical Manual' },
      { id: 'b', text: 'National Indicator Framework (NIF) & Survey Guidelines' },
      { id: 'c', text: 'Unstructured Field Register' },
      { id: 'd', text: 'Commercial Data Codex' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
  {
    id: 'q2',
    courseId: 'c1',
    topicId: 't2',
    prompt: 'What is the primary benefit of stratified multi-stage sampling in large-scale socio-economic surveys?',
    options: [
      { id: 'a', text: 'Completely eliminates non-sampling errors' },
      { id: 'b', text: 'Optimizes operational field costs while preserving representative estimates' },
      { id: 'c', text: 'Removes the need for enumerator training' },
      { id: 'd', text: 'Guarantees equal sample sizes in all villages' },
    ],
    correctOptionId: 'b',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q3',
    courseId: 'c1',
    topicId: 't4',
    prompt: 'Which validation rule checks that reported monthly household food expenditure is within plausible bounds?',
    options: [
      { id: 'a', text: 'String length verification' },
      { id: 'b', text: 'Range validation and ratio audit' },
      { id: 'c', text: 'Type casting check' },
      { id: 'd', text: 'File compression test' },
    ],
    correctOptionId: 'b',
    difficulty: 'easy',
    status: 'approved',
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: 'a1',
    courseId: 'c1',
    title: 'Survey Methodology & Sampling Quiz',
    questionIds: ['q1', 'q2', 'q3'],
    createdAt: '2025-08-20T10:00:00Z',
    assessmentType: 'teacher_test',
  },
];

export const mockAttempts: Attempt[] = [
  {
    id: 'att1',
    assessmentId: 'a1',
    studentId: 's1',
    studentName: 'Rahul Sharma',
    answers: [
      { questionId: 'q1', selectedOptionId: 'b', correct: true },
      { questionId: 'q2', selectedOptionId: 'b', correct: true },
      { questionId: 'q3', selectedOptionId: 'b', correct: true },
    ],
    submittedAt: '2025-08-22T14:30:00Z',
    overallScorePercent: 100,
  },
];

// Student enrollment map
const enrollments: Record<string, string[]> = {
  s1: ['c1', 'c2'],
  s2: ['c1'],
  s3: ['c1', 'c2'],
};

// Pre-computed topic scores per student per course
const studentTopicScores: Record<string, Record<string, TopicScore[]>> = {
  s1: {
    c1: [
      { topicId: 't1', topicName: 'Survey Methodology', scorePercent: 78, questionsAnswered: 12, questionsCorrect: 9 },
      { topicId: 't2', topicName: 'Sampling Methods', scorePercent: 52, questionsAnswered: 10, questionsCorrect: 5 },
      { topicId: 't4', topicName: 'Data Validation', scorePercent: 38, questionsAnswered: 10, questionsCorrect: 4 },
      { topicId: 't5', topicName: 'Statistical Analysis', scorePercent: 64, questionsAnswered: 8, questionsCorrect: 5 },
      { topicId: 't6', topicName: 'Data Interpretation', scorePercent: 71, questionsAnswered: 7, questionsCorrect: 5 },
    ],
  },
};

export function getCoursesForTeacher(teacherId: string): Course[] {
  return mockCourses.filter((c) => c.teacherId === teacherId);
}

export function getCourseById(courseId: string): Course | undefined {
  return mockCourses.find((c) => c.id === courseId);
}

export function getTopicsForCourse(courseId: string): Topic[] {
  return mockTopics.filter((t) => t.courseId === courseId);
}

export function getQuestionsForCourse(courseId: string): Question[] {
  return mockQuestions.filter((q) => q.courseId === courseId);
}

export function getQuestionsForTopic(topicId: string): Question[] {
  return mockQuestions.filter((q) => q.topicId === topicId);
}

export function getAssessmentsForCourse(courseId: string): Assessment[] {
  return mockAssessments.filter((a) => a.courseId === courseId);
}

export function getAssessmentById(assessmentId: string): Assessment | undefined {
  return mockAssessments.find((a) => a.id === assessmentId);
}

export function getQuestionsByIds(questionIds: string[]): Question[] {
  return questionIds
    .map((id) => mockQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);
}

export function getEnrolledCoursesForStudent(studentId: string): Course[] {
  const courseIds = enrollments[studentId] ?? [];
  return courseIds
    .map((id) => mockCourses.find((c) => c.id === id))
    .filter((c): c is Course => c !== undefined);
}

export function getStudentCountForCourse(courseId: string): number {
  return Object.values(enrollments).filter((ids) => ids.includes(courseId)).length;
}

export function getStudentIdsForCourse(courseId: string): string[] {
  return Object.entries(enrollments)
    .filter(([, ids]) => ids.includes(courseId))
    .map(([sid]) => sid);
}

export function getStudentName(studentId: string): string {
  return mockUsers.find((u) => u.id === studentId)?.name ?? 'Unknown Officer';
}

export function getTopicScoresForStudent(studentId: string, courseId: string): TopicScore[] {
  return studentTopicScores[studentId]?.[courseId] ?? [];
}

export function getStudentCourseSummary(studentId: string, courseId: string): StudentCourseSummary {
  const course = getCourseById(courseId);
  const topicScores = getTopicScoresForStudent(studentId, courseId);
  const topics = getTopicsForCourse(courseId);

  const overall = topicScores.length > 0
    ? Math.round(topicScores.reduce((sum, t) => sum + t.scorePercent, 0) / topicScores.length)
    : 0;

  const weakest = topicScores.length > 0
    ? topicScores.reduce((min, t) => (t.scorePercent < min.scorePercent ? t : min), topicScores[0])
    : null;

  const recommendedOrder = computeRecommendedReviewOrder(topicScores, topics);

  return {
    courseId,
    courseName: course?.name ?? 'Unknown Programme',
    overallScorePercent: overall,
    topicScores,
    weakestTopic: weakest,
    recommendedReviewOrder: recommendedOrder,
  };
}

export function getClassWideTopicScores(courseId: string): TopicScore[] {
  const studentIds = getStudentIdsForCourse(courseId);
  const topics = getTopicsForCourse(courseId);

  return topics.map((topic) => {
    const allScores = studentIds
      .map((sid) => getTopicScoresForStudent(sid, courseId).find((ts) => ts.topicId === topic.id))
      .filter((ts): ts is TopicScore => ts !== undefined);

    const avg = allScores.length > 0
      ? Math.round(allScores.reduce((sum, ts) => sum + ts.scorePercent, 0) / allScores.length)
      : 0;

    const totalAnswered = allScores.reduce((sum, ts) => sum + ts.questionsAnswered, 0);
    const totalCorrect = allScores.reduce((sum, ts) => sum + ts.questionsCorrect, 0);

    return {
      topicId: topic.id,
      topicName: topic.name,
      scorePercent: avg,
      questionsAnswered: totalAnswered,
      questionsCorrect: totalCorrect,
    };
  });
}

export function getAttemptsForStudent(studentId: string): Attempt[] {
  return mockAttempts.filter((a) => a.studentId === studentId);
}

export function getAttemptById(attemptId: string): Attempt | undefined {
  return mockAttempts.find((a) => a.id === attemptId);
}

export function computeAttemptScores(attempt: Attempt): TopicScore[] {
  const questions = getQuestionsByIds(attempt.answers.map((a) => a.questionId));
  const topics = getTopicsForCourse(questions[0]?.courseId ?? '');

  const byTopic = new Map<string, { answered: number; correct: number }>();

  for (const answer of attempt.answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question || !question.topicId) continue;
    const entry = byTopic.get(question.topicId) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (answer.correct) entry.correct += 1;
    byTopic.set(question.topicId, entry);
  }

  return topics
    .map((topic) => {
      const entry = byTopic.get(topic.id) ?? { answered: 0, correct: 0 };
      return {
        topicId: topic.id,
        topicName: topic.name,
        scorePercent: entry.answered > 0 ? Math.round((entry.correct / entry.answered) * 100) : 0,
        questionsAnswered: entry.answered,
        questionsCorrect: entry.correct,
      };
    })
    .filter((ts) => ts.questionsAnswered > 0);
}
