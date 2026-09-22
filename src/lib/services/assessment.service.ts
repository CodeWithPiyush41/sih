import { supabase } from '@/lib/supabase/client';
import { Assessment, AssessmentConfig } from '@/lib/types';
import { AIClient } from '@/lib/api/ai.client';

export const AssessmentService = {
  async getTeacherAssessments(courseId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('assessments')
      .select('*, materials(title)')
      .eq('assessment_type', 'teacher_test');

    if (courseId) {
      query = query.eq('course_id', courseId);
    } else {
      // In a real scenario we'd query by courses the teacher is assigned to,
      // but for simplicity we assume the RLS handles teacher scope or we query all available to them.
      // E.g., we only show tests the teacher created themselves or their courses.
      query = query.eq('creator_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getStudentAssignedAssessments() {
    // Relying on RLS: Students read published teacher tests for their enrolled courses
    const { data, error } = await supabase
      .from('assessments')
      .select('*, materials(title)')
      .eq('assessment_type', 'teacher_test')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async getStudentPersonalAssessments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assessments')
      .select('*, materials(title)')
      .eq('assessment_type', 'personal_test')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Complete flow to generate a personal test:
   * 1. Call AI Orchestrator to analyze and generate questions
   * 2. Insert into Supabase (questions, assessment, mapping)
   */
  async createPersonalTest(materialId: string, extractedText: string, config: Partial<AssessmentConfig>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Analyze PDF topics (if not already extracted)
    const { topics } = await AIClient.extractTopics(extractedText);
    const topLevelTopics = topics.map((t: any) => t.name).slice(0, 3); // take top 3 for testing

    // 2. Generate questions
    const { questions } = await AIClient.generateQuestions({
      materialContext: extractedText,
      topics: topLevelTopics,
      difficulty: config.difficultyMode || 'normal',
      count: config.questionCount || 5
    });

    if (!questions || questions.length === 0) {
      throw new Error('AI failed to generate questions');
    }

    // 3. Save to database
    // Start a transaction-like sequence (or just sequential inserts)
    
    // Create Assessment record
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        title: config.title || 'Personal Practice Test',
        creator_id: user.id,
        assessment_type: 'personal_test',
        material_id: materialId,
        difficulty: config.difficultyMode || 'normal',
        question_count: questions.length,
        time_limit_minutes: config.timeLimitMinutes || 30,
        status: 'published' // auto publish personal tests
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Insert Questions and Options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      const { data: questionData, error: qError } = await supabase
        .from('questions')
        .insert({
          material_id: materialId,
          question_type: q.question_type,
          difficulty: q.difficulty,
          question_text: q.question,
          marks: q.marks,
          created_by: user.id
        })
        .select()
        .single();
        
      if (qError) throw qError;

      // Map question to assessment
      await supabase.from('assessment_questions').insert({
        assessment_id: assessmentData.id,
        question_id: questionData.id,
        question_order: i + 1,
        marks: q.marks
      });

      // Insert Options if MCQ
      if (q.question_type === 'mcq' && q.options) {
        const optionsData = q.options.map((opt: any, idx: number) => ({
          question_id: questionData.id,
          option_text: opt.text,
          option_order: idx + 1,
          is_correct: opt.is_correct
        }));

        await supabase.from('question_options').insert(optionsData);
      }
    }

    return assessmentData;
  }
};
