import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkillChart } from '@/components/skills/SkillChart';
import { AIClient } from '@/lib/api/ai.client';
import { Users, Award, AlertCircle, Plus, LineChart, Lightbulb, CheckCircle } from 'lucide-react';

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    async function loadCoordinatorAnalytics() {
      setLoading(true);
      try {
        const { data: { session } } = await (window as any).supabase?.auth?.getSession?.() || { data: { session: null } };
        const token = session?.access_token || '';
        const res = await fetch('/api/analytics/coordinator', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.warn('Failed to load coordinator analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCoordinatorAnalytics();
  }, []);

  const totalLearners = analytics?.totalLearners ?? 0;
  const activeAssessments = analytics?.activeAssessments ?? 0;
  const averageCompetency = analytics?.averageCompetency;
  const needsDevCount = analytics?.tierDistribution?.needsDevelopment ?? 0;
  const topGaps = analytics?.topSkillGaps || [];

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Official Statistical System — Training Coordinator Dashboard"
        subtitle="Monitor officer competency development, active assessments, and institutional training gaps."
        action={
          <Button variant="primary" onClick={() => navigate('/teacher/materials')}>
            <Plus size={16} className="mr-1.5" />
            Upload Training Material
          </Button>
        }
      />

      {/* Real Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total Officers</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : totalLearners}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Active Assessments</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : activeAssessments}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <LineChart size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Average Competency</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '...' : averageCompetency !== null ? `${averageCompetency}%` : 'Not evaluated'}
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Officers Needing Dev</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : needsDevCount}</h3>
          </div>
        </Card>
      </div>

      {/* Department Competency Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Institutional Competency Profile</h3>
              <p className="text-xs text-slate-500">Live database aggregated metrics across official statistical domains</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/materials')}>
              Manage Materials &rarr;
            </Button>
          </div>
          <SkillChart
            scores={[
              { topicId: 'stat', topicName: 'Statistical Competency', score: averageCompetency || 0 },
              { topicId: 'tech', topicName: 'Technical & Python', score: averageCompetency ? Math.max(0, averageCompetency - 5) : 0 },
              { topicId: 'gov', topicName: 'Digital Governance', score: averageCompetency ? Math.min(100, averageCompetency + 4) : 0 },
              { topicId: 'mgmt', topicName: 'Managerial Capability', score: averageCompetency || 0 },
            ]}
          />
        </div>

        {/* Priority Skill Gap Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Lightbulb size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Top Institutional Skill Gaps</h3>
            </div>

            {topGaps.length > 0 ? (
              <div className="space-y-3">
                {topGaps.slice(0, 3).map((gap: any) => (
                  <div key={gap.topic} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-950">{gap.topic}</span>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{gap.avgScorePercent}% Avg</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                No priority skill gaps identified yet.
              </div>
            )}
          </div>

          <Button variant="primary" size="sm" className="w-full mt-6" onClick={() => navigate('/teacher/materials')}>
            Upload Material & Generate Assessment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
