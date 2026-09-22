import { supabase } from '../supabase/client';

const API_BASE_URL = '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Try to get a valid session token to pass to the backend
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const userId = session?.user?.id;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const AIClient = {
  getHealth: () => fetchWithAuth('/ai/health'),
  
  analyzePDF: (textContext: string) => 
    fetchWithAuth('/ai/analyze-pdf', { method: 'POST', body: JSON.stringify({ textContext }) }),

  extractTopics: (textContext: string) => 
    fetchWithAuth('/ai/extract-topics', { method: 'POST', body: JSON.stringify({ textContext }) }),

  generateQuestions: (params: any) => 
    fetchWithAuth('/ai/generate-questions', { method: 'POST', body: JSON.stringify(params) }),

  validateQuestion: (question: any) => 
    fetchWithAuth('/ai/validate-question', { method: 'POST', body: JSON.stringify(question) }),

  evaluateAnswer: (params: any) => 
    fetchWithAuth('/ai/evaluate-answer', { method: 'POST', body: JSON.stringify(params) }),

  createLearningPlan: (params: any) => 
    fetchWithAuth('/ai/create-learning-plan', { method: 'POST', body: JSON.stringify(params) }),

  analyzeCode: (params: any) => 
    fetchWithAuth('/ai/analyze-code', { method: 'POST', body: JSON.stringify(params) }),

  // Phase 12 Assessment Methods
  generateAssessment: (params: { materialId?: string; topic?: string; competencyArea?: string; difficulty?: string; questionCount?: number; title?: string; assessmentType?: string }) =>
    fetchWithAuth('/assessments/generate', { method: 'POST', body: JSON.stringify(params) }),

  getAssessments: () =>
    fetchWithAuth('/assessments'),

  getAssessmentDetails: (id: string) =>
    fetchWithAuth(`/assessments/${id}`),

  submitAssessmentAttempt: (id: string, answers: Array<{ questionId: string; selectedOptionId?: string; answerText?: string }>) =>
    fetchWithAuth(`/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  getAttemptResult: (attemptId: string) =>
    fetchWithAuth(`/assessments/attempts/${attemptId}`),
};
