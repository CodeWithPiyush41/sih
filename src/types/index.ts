export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'officer' | 'training_coordinator';
  avatar?: string;
  designation?: string;
  departmentMdo?: string;
  yearsExperience?: number;
}

export interface Material {
  id: string;
  title: string;
  filename: string;
  sizeBytes: number;
  uploadDate: string;
  topics: string[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  masteryLevel: number; // 0 to 100
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'short_answer' | 'coding' | 'debugging';
  text: string;
  options?: QuestionOption[]; // For MCQ
  correctAnswer?: string; // For short answer
  codeSnippet?: string; // Initial code for coding/debugging
  testCases?: { input: string; expectedOutput: string }[];
  explanation: string;
  difficulty: 'Normal' | 'Medium' | 'Hard';
  topicId: string;
  marks?: number;
}

export interface Assessment {
  id: string;
  title: string;
  materialId: string;
  courseId?: string;
  difficulty: 'Normal' | 'Medium' | 'Hard';
  timeLimitMinutes: number;
  questions: Question[];
  questionIds?: string[];
  createdAt: string;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  score?: number;
  maxScore?: number;
  topicScores?: Record<string, number>;
  topicMaxScores?: Record<string, number>;
  answers: Record<string, string>; // questionId -> answer
}

export interface SkillScore {
  topicId: string;
  topicName: string;
  score: number; // 0 to 100
  scorePercent?: number;
  trend?: 'up' | 'down' | 'flat';
  questionsAnswered?: number;
  questionsCorrect?: number;
  status?: string;
}

export interface StudentProgress {
  userId: string;
  overallScore: number;
  completedAssessments: number;
  skillScores: SkillScore[];
  recentActivity: { date: string; title: string; score: number }[];
}

export interface LearningStepNode {
  id: string;
  title: string;
  description?: string;
  type: 'concept' | 'practice' | 'quiz' | 'reassessment';
  status: 'locked' | 'current' | 'completed';
  completed?: boolean;
  current?: boolean;
  topicId?: string;
  scorePercent?: number;
}

export interface PracticeRecommendation {
  id: string;
  topicId: string;
  topicName: string;
  questionsAvailable?: number;
  questionCount?: number;
  focusConcepts: string[];
  focusAreas?: string[];
  previousScore?: number;
  currentScorePercent: number;
  estimatedMinutes: number;
}

export interface Course {
  id: string;
  name: string;
  subjectId: string;
  teacherId?: string;
  studentIds: string[];
  status: 'Active' | 'Inactive';
}

export interface Subject {
  id: string;
  name: string;
  description: string;
}

export interface TeacherAnalytics {
  teacherId: string;
  totalStudents: number;
  totalAssessments: number;
  averageSkillScore: number;
  studentsNeedingAttention: number;
}

export interface TeacherAssessmentView extends Assessment {
  source: 'Teacher Created' | 'Student Material';
  attemptsCount: number;
  averageScore: number;
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeAssessments: number;
}
