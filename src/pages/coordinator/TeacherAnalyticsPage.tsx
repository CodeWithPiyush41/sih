import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { SkillChart } from '@/components/skills/SkillChart';
import { SkillBreakdown } from '@/components/skills/SkillBreakdown';
import { mockSkillScores } from '@/lib/mock';
import { TrendingUp, Users, Target, BookOpen } from 'lucide-react';

export function TeacherAnalyticsPage() {
  const topTopics = [...mockSkillScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const weakTopics = [...mockSkillScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Class-Wide Competency Analytics"
        subtitle="Aggregate skill distributions, cohort benchmarks, and concept weak areas."
      />

      {/* Main Class Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="font-bold text-slate-900 text-base mb-1">Cohort Topic Competency Matrix</h3>
        <p className="text-xs text-slate-500 mb-6">Percentage of average correct answers per topic across 38 students</p>
        <SkillChart scores={mockSkillScores} />
      </div>

      <SkillBreakdown scores={mockSkillScores} />
    </DashboardLayout>
  );
}
