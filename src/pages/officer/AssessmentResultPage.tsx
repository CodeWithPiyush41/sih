import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkillChart } from '@/components/skills/SkillChart';
import { SkillBreakdown } from '@/components/skills/SkillBreakdown';
import { mockSkillScores } from '@/lib/mock';
import { RotateCcw, GitMerge, Eye } from 'lucide-react';
import { Attempt } from '@/types';

export function AssessmentResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const attempt = location.state?.attempt as Attempt | undefined;

  let overallScore = 68;
  let dynamicSkillScores = mockSkillScores as any[];
  let marksText = '34 / 50';

  if (attempt) {
    if (attempt.maxScore && attempt.score !== undefined) {
      overallScore = Math.round((attempt.score / attempt.maxScore) * 100);
      marksText = `${attempt.score} / ${attempt.maxScore}`;
    }

    if (attempt.topicScores && attempt.topicMaxScores) {
      dynamicSkillScores = Object.entries(attempt.topicScores).map(([topicId, score]) => {
        const maxScore = attempt.topicMaxScores![topicId] || 1;
        const percentage = Math.round((score / maxScore) * 100);
        
        const mockTopic = mockSkillScores.find(m => m.topicId === topicId);
        return {
          topicId,
          topicName: mockTopic?.topicName || topicId,
          score: percentage,
          scorePercent: percentage,
          trend: percentage > 70 ? 'up' : percentage < 50 ? 'down' : 'flat',
        };
      });
    }
  }

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Competency Assessment Results"
        subtitle="Detailed analysis of your statistical competency performance and identified learning gaps."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-slate-50 border border-slate-200">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-3xl mb-4 border border-primary/20 shadow-xs">
            {overallScore}%
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Competency Evaluated</h3>
          <p className="text-xs text-slate-500 mb-4">{marksText} total evaluation marks</p>

          <div className="flex flex-col gap-2 w-full mt-2">
            <Button
              variant="outline"
              className="w-full text-xs font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
              onClick={() => {
                document.getElementById('topic-breakdown')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Eye size={14} className="mr-1.5" /> Show Answers
            </Button>
            <Button
              variant="primary"
              className="w-full text-xs font-bold bg-primary hover:bg-primary/90"
              onClick={() => navigate('/student/learning-path')}
            >
              <GitMerge size={14} className="mr-1.5" /> Learning Path
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
              onClick={() => {
                if (attempt?.assessmentId) {
                  navigate(`/student/assessments/${attempt.assessmentId}`);
                } else {
                  navigate('/student/assessments');
                }
              }}
            >
              <RotateCcw size={14} className="mr-1.5" /> Retry Assessment
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Competency Breakdown</h3>
          <SkillChart scores={dynamicSkillScores} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="font-bold text-slate-900 text-base mb-4">Topic Performance</h3>
        <SkillBreakdown scores={dynamicSkillScores} />
      </div>
    </DashboardLayout>
  );
}
