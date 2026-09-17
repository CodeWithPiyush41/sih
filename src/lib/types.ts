export interface Course {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  courseId: string;
  name: string;
  prerequisiteTopicIds: string[];
}

export interface Question {
  id: string;
  courseId: string;
  topicId: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending_review' | 'approved' | 'rejected';
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  questionIds: string[];
  createdAt: string;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  studentId: string;
  answers: { questionId: string; selectedOptionId: string; correct: boolean }[];
  submittedAt: string;
}

export interface TopicScore {
  topicId: string;
  topicName: string;
  scorePercent: number;
  questionsAnswered: number;
  questionsCorrect: number;
}

export interface StudentCourseSummary {
  courseId: string;
  courseName: string;
  overallScorePercent: number;
  topicScores: TopicScore[];
  weakestTopic: TopicScore | null;
  recommendedReviewOrder: string[];
}

export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
}
