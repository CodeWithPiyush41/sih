import { Assessment, Material, Question, SkillScore, StudentProgress, Topic, User } from '@/types';

export const mockUser: User = {
  id: 'u1',
  name: 'Rahul Sharma',
  email: 'officer@poornima.org',
  role: 'student',
  designation: 'Statistical Officer',
  departmentMdo: 'Ministry of Statistics and Programme Implementation',
  yearsExperience: 6,
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
};

export const mockTeacher: User = {
  id: 't1',
  name: 'Dr. Rajesh Kumar',
  email: 'coordinator@poornima.org',
  role: 'teacher',
  designation: 'Director of Training',
  departmentMdo: 'National Statistical Systems Training Academy',
  yearsExperience: 14,
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
};

export const mockMaterials: Material[] = [
  {
    id: 'm1',
    title: 'Official Survey Methodology & Sampling Standards',
    filename: 'survey_methodology_standards.pdf',
    sizeBytes: 2540000,
    uploadDate: '2026-09-10T10:00:00Z',
    topics: ['Survey Methodology', 'Sampling Methods', 'Data Collection'],
  },
  {
    id: 'm2',
    title: 'Data Validation & Quality Audit Guidelines',
    filename: 'data_validation_guidelines.pdf',
    sizeBytes: 4200000,
    uploadDate: '2026-09-14T14:30:00Z',
    topics: ['Data Validation', 'Data Quality Assurance', 'Imputation'],
  },
];

export const mockTopics: Topic[] = [
  { id: 't1', name: 'Survey Methodology', description: 'Survey design and field schedule setup', masteryLevel: 78 },
  { id: 't2', name: 'Sampling Methods', description: 'Stratified sampling and cluster frames', masteryLevel: 52 },
  { id: 't3', name: 'Data Collection', description: 'CAPI validation rules and enumerator monitoring', masteryLevel: 68 },
  { id: 't4', name: 'Data Validation', description: 'Logical edits, range bounds, and anomaly checks', masteryLevel: 38 },
  { id: 't5', name: 'Statistical Analysis', description: 'Weighted estimation and time series diagnostics', masteryLevel: 64 },
];

export const mockSkillScores: (SkillScore & { scorePercent: number; questionsAnswered: number; questionsCorrect: number; status: string })[] = [
  { topicId: 't1', topicName: 'Survey Methodology', score: 78, scorePercent: 78, trend: 'up', questionsAnswered: 12, questionsCorrect: 9, status: 'mastered' },
  { topicId: 't2', topicName: 'Sampling Methods', score: 52, scorePercent: 52, trend: 'flat', questionsAnswered: 10, questionsCorrect: 5, status: 'developing' },
  { topicId: 't4', topicName: 'Data Validation', score: 38, scorePercent: 38, trend: 'down', questionsAnswered: 10, questionsCorrect: 4, status: 'needs_practice' },
  { topicId: 't5', topicName: 'Statistical Analysis', score: 64, scorePercent: 64, trend: 'up', questionsAnswered: 8, questionsCorrect: 5, status: 'developing' },
  { topicId: 't3', topicName: 'Data Interpretation', score: 71, scorePercent: 71, trend: 'up', questionsAnswered: 7, questionsCorrect: 5, status: 'mastered' },
];

export const mockStudentProgress: StudentProgress = {
  userId: 'u1',
  overallScore: 68,
  completedAssessments: 4,
  skillScores: mockSkillScores,
  recentActivity: [
    { date: '2026-09-01', title: 'Survey Principles', score: 55 },
    { date: '2026-09-05', title: 'Sampling & Frames', score: 62 },
    { date: '2026-09-10', title: 'Field Protocol Review', score: 78 },
    { date: '2026-09-16', title: 'Data Validation Assessment', score: 38 },
  ],
};

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    type: 'mcq',
    text: 'Which validation rule checks that reported monthly household food expenditure is within plausible bounds?',
    options: [
      { id: 'o1', text: 'String length check', isCorrect: false },
      { id: 'o2', text: 'Range validation and ratio audit', isCorrect: true },
      { id: 'o3', text: 'Type casting check', isCorrect: false },
      { id: 'o4', text: 'File compression test', isCorrect: false },
    ],
    explanation: 'Logical boundary checks enforce structural relations.',
    difficulty: 'Normal',
    topicId: 't4',
    marks: 2,
  },
];

export const mockAssessment: Assessment = {
  id: 'a1',
  title: 'Official Statistical Systems & Data Validation Assessment',
  materialId: 'm1',
  courseId: 'c1',
  difficulty: 'Medium',
  timeLimitMinutes: 20,
  questions: mockQuestions,
  questionIds: mockQuestions.map(q => q.id),
  createdAt: '2026-09-15T11:00:00Z',
};

export const mockAssessments: Assessment[] = [mockAssessment];

export const mockTargetedPractice = {
  id: 'p1',
  topicId: 't4',
  topicName: 'Data Validation',
  questionsAvailable: 10,
  questionCount: 5,
  focusConcepts: ['Logical consistency checks & Range bounds', 'Outlier detection in government surveys', 'Hot-deck and cold-deck imputation standards'],
  focusAreas: ['Logical consistency checks', 'Outlier bounds'],
  previousScore: 38,
  currentScorePercent: 38,
  estimatedMinutes: 20
};

export const mockLearningPath = [
  { id: 'lp1', title: 'Survey Methodology Basics', description: 'Review guidelines for survey frame setup', type: 'concept' as const, status: 'completed' as const, completed: true, current: false },
  { id: 'lp2', title: 'Data Validation Protocols', description: 'Understand range checks and logical edits', type: 'concept' as const, status: 'current' as const, completed: false, current: true },
  { id: 'lp3', title: 'iGOT Course Practice', description: 'Complete recommended iGOT module', type: 'practice' as const, status: 'locked' as const, completed: false, current: false },
  { id: 'lp4', title: 'Competency Reassessment', description: 'Complete 15-minute evaluation', type: 'reassessment' as const, status: 'locked' as const, completed: false, current: false },
];

export const mockCourses = [
  { id: 'c1', name: 'Official Statistical Systems & Survey Methodology', subjectId: 's1', teacherId: 't1', studentIds: ['u1', 'u2'], status: 'Active' as const },
  { id: 'c2', name: 'Advanced Data Validation & Quality Assurance', subjectId: 's2', teacherId: 't1', studentIds: ['u3'], status: 'Active' as const },
];

export const mockSubjects = [
  { id: 's1', name: 'Survey Methodology', description: 'Core Official Statistics and Field Operations' },
  { id: 's2', name: 'Data Validation', description: 'Quality Audit and Imputation Standards' },
];

export const mockAdminStats = {
  totalStudents: 310,
  totalTeachers: 22,
  totalCourses: 8,
  activeAssessments: 42,
};

export const mockTeacherAnalytics = {
  teacherId: 't1',
  totalStudents: 24,
  totalAssessments: 8,
  averageSkillScore: 68,
  studentsNeedingAttention: 4,
};

export const mockStudentsList = [
  { id: 'u1', name: 'Rahul Sharma', email: 'officer@poornima.org', assessments: 4, overallSkill: 68, lastAssessment: '1 day ago', status: 'On Track' },
  { id: 'u2', name: 'Priya Verma', email: 'priya@poornima.org', assessments: 6, overallSkill: 82, lastAssessment: '4 hours ago', status: 'On Track' },
  { id: 'u3', name: 'Amit Patel', email: 'amit@poornima.org', assessments: 3, overallSkill: 44, lastAssessment: '1 week ago', status: 'At Risk' },
];

export const mockTeacherAssessments = [
  { id: 'a1', title: 'Official Statistical Systems Assessment', source: 'Teacher Created' as const, materialId: 'm1', difficulty: 'Medium' as const, questionsCount: 15, attemptsCount: 18, averageScore: 58, date: 'Sep 15' },
];

export const mockQuestionPerformance = [
  { questionId: 'q1', text: 'Which validation check should be applied when verifying consumption survey records?', correctPercent: 38 },
];
