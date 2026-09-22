import type {
  User,
  Material,
  Topic,
  Question,
  Assessment,
  Attempt,
  TopicScore,
  PracticeRecommendation,
  LearningStepNode,
  StudentProgressItem,
  ClassAnalytics,
} from '@/lib/types';

export const mockUsers: User[] = [
  {
    id: 't1',
    name: 'Dr. Rajesh Kumar',
    email: 'coordinator@poornima.org',
    role: 'teacher',
    designation: 'Director of Training',
    departmentMdo: 'National Statistical Systems Training Academy (NSSTA)',
    yearsExperience: 14,
    location: 'Greater Noida',
  },
  {
    id: 's1',
    name: 'Rahul Sharma',
    email: 'officer@poornima.org',
    role: 'student',
    designation: 'Statistical Officer',
    departmentMdo: 'Ministry of Statistics and Programme Implementation (MoSPI)',
    yearsExperience: 6,
    location: 'New Delhi',
  },
  {
    id: 's2',
    name: 'Priya Verma',
    email: 'priya@poornima.org',
    role: 'student',
    designation: 'Assistant Director (Statistics)',
    departmentMdo: 'National Sample Survey Office (NSSO)',
    yearsExperience: 4,
    location: 'Kolkata',
  },
  {
    id: 's3',
    name: 'Amit Patel',
    email: 'amit@poornima.org',
    role: 'student',
    designation: 'Senior Statistical Inspector',
    departmentMdo: 'Central Statistics Office (CSO)',
    yearsExperience: 8,
    location: 'Mumbai',
  },
];

export const mockMaterials: Material[] = [
  {
    id: 'mat-1',
    courseId: 'c1',
    fileName: 'Official_Survey_Methodology_and_Sampling_Standards.pdf',
    fileSize: 4250000,
    fileType: 'application/pdf',
    topics: ['Survey Methodology', 'Sampling Methods', 'Data Collection', 'Data Validation'],
    uploadedAt: '2026-09-10T10:00:00Z',
    uploadedBy: 'Dr. Rajesh Kumar',
    extractedText: 'Manual on Large Scale Sample Survey Design, Stratified Multi-Stage Sampling, Frame Verification, and Non-Sampling Error Controls...',
    status: 'ready',
    materialType: 'teacher_material',
    visibility: 'course',
  },
  {
    id: 'mat-2',
    courseId: 'c1',
    fileName: 'Data_Validation_and_Quality_Audit_Guidelines.pdf',
    fileSize: 2850000,
    fileType: 'application/pdf',
    topics: ['Data Validation', 'Data Quality Assurance', 'Imputation'],
    uploadedAt: '2026-09-14T14:30:00Z',
    uploadedBy: 'Dr. Rajesh Kumar',
    extractedText: 'MoSPI standard protocols for logical consistency checks, outlier detection bounds, and automated data imputation...',
    status: 'ready',
    materialType: 'teacher_material',
    visibility: 'course',
  },
  {
    id: 'mat-3',
    courseId: undefined,
    fileName: 'Personal_Notes_on_National_Indicator_Framework.pdf',
    fileSize: 1540000,
    fileType: 'application/pdf',
    topics: ['Data Dissemination', 'Statistical Analysis'],
    uploadedAt: '2026-09-15T09:15:00Z',
    uploadedBy: 'Rahul Sharma',
    extractedText: 'Personal officer notes on SDG monitoring, indicator calculations, and periodic labor force survey tables...',
    status: 'ready',
    materialType: 'personal_material',
    visibility: 'private',
  },
];

export const mockTopics: Topic[] = [
  { id: 'top-1', courseId: 'c1', name: 'Survey Methodology', description: 'Survey design, schedules, and field protocol formulation', prerequisiteTopicIds: [] },
  { id: 'top-2', courseId: 'c1', name: 'Sampling Methods', description: 'Stratified sampling, cluster frames, and design effect estimation', prerequisiteTopicIds: ['top-1'] },
  { id: 'top-3', courseId: 'c1', name: 'Data Collection', description: 'CAPI validation rules, enumerator monitoring, and coverage checks', prerequisiteTopicIds: ['top-1'] },
  { id: 'top-4', courseId: 'c1', name: 'Data Validation', description: 'Consistency rules, Range verification, and anomaly detection', prerequisiteTopicIds: ['top-2', 'top-3'] },
  { id: 'top-5', courseId: 'c1', name: 'Statistical Analysis', description: 'Parametric tests, time series decomposition, and weighted estimation', prerequisiteTopicIds: ['top-4'] },
];

export const mockSkillScores: TopicScore[] = [
  { topicId: 'top-1', topicName: 'Survey Methodology', scorePercent: 78, questionsAnswered: 12, questionsCorrect: 9, status: 'mastered' },
  { topicId: 'top-2', topicName: 'Sampling Methods', scorePercent: 52, questionsAnswered: 10, questionsCorrect: 5, status: 'developing' },
  { topicId: 'top-4', topicName: 'Data Validation', scorePercent: 38, questionsAnswered: 10, questionsCorrect: 4, status: 'needs_practice' },
  { topicId: 'top-5', topicName: 'Statistical Analysis', scorePercent: 64, questionsAnswered: 8, questionsCorrect: 5, status: 'developing' },
  { topicId: 'top-3', topicName: 'Data Interpretation', scorePercent: 71, questionsAnswered: 7, questionsCorrect: 5, status: 'mastered' },
];

export const mockQuestions: Question[] = [
  {
    id: 'q-stat-1',
    courseId: 'c1',
    topicId: 'top-4',
    type: 'mcq',
    prompt: 'Which data validation check should be applied when verifying household consumption expenditure survey records?',
    options: [
      { id: 'a', text: 'Unweighted simple average ratio calculation' },
      { id: 'b', text: 'Logical boundary check ensuring commodity item expenditure <= total household monthly expenditure' },
      { id: 'c', text: 'Arbitrary random substitution of missing field values' },
      { id: 'd', text: 'Omission of non-responding primary sampling units' },
    ],
    correctOptionId: 'b',
    explanation: 'Logical boundary checks enforce structural relations where sub-item totals cannot exceed total reported household expenditure.',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q-stat-2',
    courseId: 'c1',
    topicId: 'top-2',
    type: 'conceptual',
    prompt: 'In a two-stage stratified cluster sampling design, why are multipliers/weights applied during estimation?',
    options: [
      { id: 'a', text: 'To inflate sample size for aesthetic reporting' },
      { id: 'b', text: 'To adjust for unequal selection probabilities across strata and non-response bias' },
      { id: 'c', text: 'To eliminate the need for standard error calculation' },
      { id: 'd', text: 'To convert qualitative field notes into binary values' },
    ],
    correctOptionId: 'b',
    explanation: 'Sampling weights account for inverse probability of selection at each stage and adjust for non-response.',
    difficulty: 'medium',
    status: 'approved',
  },
  {
    id: 'q-stat-coding-1',
    courseId: 'c1',
    topicId: 'top-4',
    type: 'coding',
    prompt: 'Write a data validation function in Python to flag records where reported age < 15 but marital status is recorded as Married.',
    difficulty: 'hard',
    status: 'approved',
    codeTemplate: `def validate_survey_record(record):\n    # record contains 'age' (int) and 'marital_status' (str)\n    # Return True if valid, False if anomaly detected\n    pass`,
    testCases: [
      { input: "{'age': 12, 'marital_status': 'Married'}", output: 'False' },
      { input: "{'age': 28, 'marital_status': 'Married'}", output: 'True' },
    ],
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: 'assm-1',
    courseId: 'c1',
    title: 'Official Statistical Systems & Data Validation Assessment',
    questionIds: ['q-stat-1', 'q-stat-2', 'q-stat-coding-1'],
    createdAt: '2026-09-15T11:00:00Z',
    durationMinutes: 20,
    difficultyMode: 'medium',
    assessmentType: 'teacher_test',
  },
];

export const mockAttempts: Attempt[] = [
  {
    id: 'att-101',
    assessmentId: 'assm-1',
    studentId: 's1',
    studentName: 'Rahul Sharma',
    answers: [
      { questionId: 'q-stat-1', selectedOptionId: 'a', correct: false },
      { questionId: 'q-stat-2', selectedOptionId: 'b', correct: true },
      { questionId: 'q-stat-coding-1', submittedCode: 'def validate_survey_record(record): return record["age"] >= 15 or record["marital_status"] != "Married"', correct: true },
    ],
    submittedAt: '2026-09-16T15:20:00Z',
    overallScorePercent: 38,
  },
];

export const mockTargetedPractice: PracticeRecommendation = {
  id: 'prac-1',
  topicId: 'top-4',
  topicName: 'Data Validation',
  currentScorePercent: 38,
  focusConcepts: [
    'Logical consistency checks & Range bounds',
    'Outlier detection in government surveys',
    'Hot-deck and cold-deck imputation standards',
  ],
  estimatedMinutes: 20,
  questionCount: 5,
};

export const mockLearningPath: LearningStepNode[] = [
  {
    id: 'step-1',
    title: 'Survey Methodology Basics',
    description: 'Review guidelines for survey frame setup and questionnaire rules.',
    type: 'concept',
    completed: true,
    current: false,
    scorePercent: 100,
  },
  {
    id: 'step-2',
    title: 'Data Validation Protocols',
    description: 'Understand range checks, logical edits, and anomaly flag rules.',
    type: 'concept',
    completed: false,
    current: true,
    scorePercent: 38,
  },
  {
    id: 'step-3',
    title: 'iGOT Course Practice',
    description: 'Complete recommended iGOT module on Data Validation & Quality Assurance.',
    type: 'practice',
    completed: false,
    current: false,
  },
  {
    id: 'step-4',
    title: 'Validation Exercises',
    description: 'Solve 5 practical data cleaning scenarios.',
    type: 'quiz',
    completed: false,
    current: false,
  },
  {
    id: 'step-5',
    title: 'Competency Reassessment',
    description: 'Complete 15-minute evaluation to update Competency Passport.',
    type: 'reassessment',
    completed: false,
    current: false,
  },
];

export const mockStudentProgressHistory: StudentProgressItem[] = [
  { date: 'Sep 01', overallScore: 55, assessmentTitle: 'Survey Principles' },
  { date: 'Sep 05', overallScore: 62, assessmentTitle: 'Sampling & Frames' },
  { date: 'Sep 10', overallScore: 78, assessmentTitle: 'Field Protocol Review' },
  { date: 'Sep 16', overallScore: 68, assessmentTitle: 'Data Validation Assessment' },
];

export const mockClassAnalytics: ClassAnalytics = {
  totalStudents: 24,
  totalAssessments: 8,
  averageClassScore: 68,
  studentsNeedingAttentionCount: 4,
  topicScores: [
    { topicId: 'top-1', topicName: 'Survey Methodology', scorePercent: 78, questionsAnswered: 96, questionsCorrect: 75 },
    { topicId: 'top-2', topicName: 'Sampling Methods', scorePercent: 62, questionsAnswered: 88, questionsCorrect: 55 },
    { topicId: 'top-4', topicName: 'Data Validation', scorePercent: 44, questionsAnswered: 100, questionsCorrect: 44 },
    { topicId: 'top-5', topicName: 'Statistical Analysis', scorePercent: 68, questionsAnswered: 80, questionsCorrect: 54 },
    { topicId: 'top-3', topicName: 'Data Interpretation', scorePercent: 75, questionsAnswered: 70, questionsCorrect: 52 },
  ],
};
