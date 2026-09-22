export type Role = 'teacher' | 'student' | 'admin' | 'officer' | 'training_coordinator';

export interface Course {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  designation?: string;
  departmentMdo?: string;
  yearsExperience?: number;
  location?: string;
}

export interface Material {
  id: string;
  courseId?: string | null;
  subjectId?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath?: string;
  topics: string[];
  uploadedAt: string;
  uploadedBy: string;
  extractedText?: string;
  status: 'ready' | 'processing' | 'error';
  materialType?: 'teacher_material' | 'personal_material';
  visibility?: 'public' | 'private' | 'course';
}

export interface Topic {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  prerequisiteTopicIds: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'pending_review' | 'approved' | 'rejected';
export type QuestionType = 'mcq' | 'conceptual' | 'code_output' | 'debugging' | 'coding';

export interface Question {
  id: string;
  courseId?: string | null;
  topicId?: string | null;
  type?: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  correctOptionId?: string;
  explanation?: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  codeTemplate?: string;
  expectedOutput?: string;
  testCases?: { input: string; output: string }[];
  createdBy?: string;
}

export type DifficultyMode = 'normal' | 'medium' | 'hard';

export interface AssessmentConfig {
  materialId?: string;
  courseId?: string | null;
  title: string;
  difficultyMode: DifficultyMode;
  questionCount: number;
  timeLimitMinutes: number;
  topics: string[];
}

export interface Assessment {
  id: string;
  courseId?: string | null;
  title: string;
  questionIds: string[];
  createdAt: string;
  durationMinutes?: number;
  difficultyMode?: DifficultyMode;
  creatorId?: string;
  assessmentType?: 'teacher_test' | 'personal_test';
  materialId?: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  submittedCode?: string;
  correct: boolean;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName?: string;
  answers: AttemptAnswer[];
  submittedAt: string;
  overallScorePercent?: number;
}

export interface TopicScore {
  topicId: string;
  topicName: string;
  scorePercent: number;
  questionsAnswered: number;
  questionsCorrect: number;
  status?: 'mastered' | 'developing' | 'needs_practice';
}

export interface StudentCourseSummary {
  courseId: string;
  courseName: string;
  overallScorePercent: number;
  topicScores: TopicScore[];
  weakestTopic: TopicScore | null;
  recommendedReviewOrder: string[];
}

export interface LearningStepNode {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'practice' | 'quiz' | 'reassessment';
  completed: boolean;
  current: boolean;
  scorePercent?: number;
}

export interface PracticeRecommendation {
  id: string;
  topicId: string;
  topicName: string;
  currentScorePercent: number;
  focusConcepts: string[];
  estimatedMinutes: number;
  questionCount: number;
}

export interface StudentProgressItem {
  date: string;
  overallScore: number;
  assessmentTitle: string;
}

export interface ClassAnalytics {
  totalStudents: number;
  totalAssessments: number;
  averageClassScore: number;
  studentsNeedingAttentionCount: number;
  topicScores: TopicScore[];
}
