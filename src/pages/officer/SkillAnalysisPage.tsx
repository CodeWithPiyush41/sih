import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompetencyPassportCard } from '@/components/skills/CompetencyPassportCard';
import { SkillCard } from '@/components/skills/SkillCard';
import { SkillChart } from '@/components/skills/SkillChart';
import { SkillBreakdown } from '@/components/skills/SkillBreakdown';
import { mockSkillScores } from '@/lib/mock';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sparkles, ShieldCheck, Award, FileSearch } from 'lucide-react';

export function SkillAnalysisPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'passport' | 'matrix' | 'gap_analysis'>('passport');

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Officer Competency Profile & Passport"
        subtitle="Official Statistical System competency metrics, evidence-based gap analysis, and growth trajectory."
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('passport')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'passport'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Competency Passport</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award size={18} />
          <span>Competency Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('gap_analysis')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'gap_analysis'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSearch size={18} />
          <span>Evidence-Based Gap Analysis</span>
        </button>
      </div>

      {activeTab === 'passport' && (
        <CompetencyPassportCard
          profile={user}
          competencies={mockSkillScores as any[]}
          identifiedGaps={['Data Validation', 'Sampling Methods']}
          growthHistory={[
            { topic: 'Data Validation', initialScore: 38, currentScore: 67 },
          ]}
        />
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-8">
          {/* Grid of Skill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSkillScores.map((score) => (
              <SkillCard
                key={score.topicId}
                score={{
                  topicId: score.topicId,
                  topicName: score.topicName,
                  score: score.scorePercent,
                  questionsAnswered: score.questionsAnswered,
                  questionsCorrect: score.questionsCorrect,
                  status: score.status === 'needs_practice' ? 'needs_work' : score.status || 'developing',
                }}
              />
            ))}
          </div>

          {/* Skill Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg">Competency Breakdown</h3>
              <span className="text-sm text-slate-500 font-medium">Verified Evaluation Items</span>
            </div>
            <SkillChart
              scores={mockSkillScores.map((s) => ({
                topicId: s.topicId,
                topicName: s.topicName,
                score: s.scorePercent,
              }))}
            />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-4">Detailed Competency Breakdown</h3>
            <SkillBreakdown
              scores={mockSkillScores.map((s) => ({
                topicId: s.topicId,
                topicName: s.topicName,
                score: s.scorePercent,
                questionsAnswered: s.questionsAnswered,
                questionsCorrect: s.questionsCorrect,
                status: s.status === 'needs_practice' ? 'needs_work' : s.status || 'developing',
              }))}
            />
          </div>
        </div>
      )}

      {activeTab === 'gap_analysis' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Evidence-Based Gap Analysis</h3>
              <p className="text-xs text-slate-500">
                Correlates measured assessment evidence with underlying concepts to isolate knowledge gaps.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Weak Area Detected</span>
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                  Data Validation — 38% Score
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Observed Assessment Evidence</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Incorrect response on Question #1 (Logical boundary check on commodity expenditure) and coding failure in record validation script.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Contributing Knowledge Gaps</h4>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 mt-1">
                  <li>Uncertainty in defining macro logical bounds vs micro range checks</li>
                  <li>Incomplete syntax understanding for multi-condition python validation filters</li>
                  <li>Confusion between cold-deck and hot-deck statistical imputation procedures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
