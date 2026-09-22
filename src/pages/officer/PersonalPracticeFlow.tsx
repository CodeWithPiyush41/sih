import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AssessmentCard } from '@/components/assessment/AssessmentCard';
import { AIClient } from '@/lib/api/ai.client';
import { Plus, BookOpen, Sparkles } from 'lucide-react';

export function PersonalPracticeFlow() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'in_progress' | 'completed'>('available');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await AIClient.getAssessments();
      setAssessments(res.assessments || []);
    } catch (err) {
      console.warn('Failed to load assessments from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableCount = assessments.filter((a) => !a.userAttempted).length;
  const completedCount = assessments.filter((a) => a.userAttempted === true || a.status === 'completed').length;

  const filteredAssessments = assessments.filter((a) => {
    if (activeTab === 'completed') return a.userAttempted === true || a.status === 'completed';
    if (activeTab === 'in_progress') return a.status === 'in_progress' || a.status === 'draft';
    if (activeTab === 'available') return !a.userAttempted;
    return true;
  });

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Competency Assessments"
        subtitle="Measure your competency through evidence-based assessments."
        action={
          <Button variant="primary" onClick={() => navigate('/student/materials')}>
            <Plus size={16} className="mr-1.5" />
            Generate from Training Materials
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 mt-8">
        <h3 className="font-bold text-slate-900 text-base">Assessment Directory</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start border border-slate-200">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'available'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'in_progress'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading competency assessments...</p>
        </div>
      ) : filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAssessments.map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={{
                id: a.id,
                title: a.title,
                subjectName: a.materials?.title || 'Official Statistical Material',
                difficulty: a.difficulty || 'medium',
                questionCount: a.question_count || 5,
                timeLimitMinutes: a.time_limit_minutes || 20,
                status: a.status || 'published',
              }}
              completedScore={a.userAttempted ? (a.userScore ?? 100) : undefined}
              onStart={(id) => navigate(`/student/assessments/${id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-slate-200 bg-slate-50/50">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl mb-3">
            <Sparkles size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No assessments available yet.</h3>
          <p className="text-slate-500 mb-6 max-w-md text-xs leading-relaxed">
            Generate or assign an assessment from your training materials to begin.
          </p>
          <Button variant="primary" onClick={() => navigate('/student/materials')}>
            <BookOpen size={16} className="mr-1.5" />
            Go to Training Materials Library
          </Button>
        </Card>
      )}
    </DashboardLayout>
  );
}
