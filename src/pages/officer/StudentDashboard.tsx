import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkillChart } from '@/components/skills/SkillChart';
import { GroundedQAComponent } from '@/components/learning/GroundedQAComponent';
import { SkillLensAssistantModal } from '@/components/chat/SkillLensAssistantModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CompetencyService, CompetencyProfileOverview } from '@/lib/services/competency.service';
import { Award, BookOpen, Target, Sparkles, Plus, Building2, Briefcase, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AIClient } from '@/lib/api/ai.client';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompetencyProfileOverview | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const compProfile = await CompetencyService.getOfficerCompetencyProfile(user?.id);
        setProfile(compProfile);

        const assRes = await AIClient.getAssessments().catch(() => ({ assessments: [] }));
        setAssessments(assRes.assessments || []);
      } catch (err) {
        console.warn('Dashboard data load warning:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  const { overallScorePercent, overallStatusTier, priorityGap, dualRecommendations, domains } = profile || {};

  const dynamicChartScores = (domains || []).map((d) => ({
    topicId: d.domain,
    topicName: d.title,
    score: d.averagePercent || 0,
    scorePercent: d.averagePercent || 0,
    trend: (d.averagePercent && d.averagePercent >= 75 ? 'up' : d.averagePercent && d.averagePercent < 50 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
  }));

  return (
    <DashboardLayout role="student">
      <PageHeader
        title={`Welcome back, ${user?.fullName || 'Statistical Officer'}!`}
        subtitle="Officer Competency Intelligence Overview & Dual iGOT / NSSTA Recommended Pathway."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAssistantOpen(true)}>
              <Sparkles size={16} className="mr-1.5 text-primary" />
              AI Assistant
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/upload')}>
              <Plus size={16} className="mr-1.5" />
              Upload Material
            </Button>
          </div>
        }
      />

      {/* Officer Metadata Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
            {user?.fullName?.charAt(0) || 'O'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{user?.fullName || 'Statistical Officer'}</h3>
            <p className="text-xs text-slate-500">{user?.designation || 'Statistical Officer'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Building2 size={16} className="text-primary" />
            <span>{user?.departmentMdo || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={16} className="text-primary" />
            <span>{user?.yearsExperience != null ? `${user.yearsExperience} years experience` : 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Competency</p>
            <p className="text-2xl font-bold text-slate-900">
              {overallScorePercent !== null ? `${overallScorePercent}%` : 'Not evaluated'}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Status: {overallStatusTier}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Target size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Priority Gap</p>
            <p className="text-base font-bold text-slate-900 truncate max-w-[140px]">
              {priorityGap ? priorityGap.topicName : (profile?.assessedTopicsCount || 0) === 0 ? 'Not yet assessed' : 'None identified'}
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              {priorityGap
                ? `${priorityGap.scorePercent}% Score (${priorityGap.statusTier})`
                : (profile?.assessedTopicsCount || 0) === 0
                ? 'Complete an assessment'
                : 'Proficient across evaluated topics'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessments Available</p>
            <p className="text-2xl font-bold text-slate-900">{assessments.length}</p>
            <p className="text-[11px] text-slate-500">Official Grounded Tests</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="p-3 rounded-xl bg-primary text-white shadow-sm">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learning Pathway</p>
            <p className="text-sm font-bold text-slate-900">iGOT + NSSTA</p>
            <p className="text-[11px] text-primary font-medium">Dual Verified Mapping</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: 4-Domain Competency Radar + Passport CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Four-Domain Competency Matrix</h3>
                <p className="text-xs text-slate-500">
                  Target: 75%+ Proficiency across Statistical, Technical, Digital Governance & Managerial
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/student/passport')}>
                Competency Passport &rarr;
              </Button>
            </div>
            <ErrorBoundary fallbackTitle="Could not render Competency Chart">
              <SkillChart scores={dynamicChartScores} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Priority Gap Summary Box */}
        <div>
          <Card className="p-6 border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Priority Skill Gap</h3>
              </div>
              {priorityGap ? (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-950 text-sm">{priorityGap.topicName}</h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {priorityGap.scorePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-amber-900">
                    Domain: <span className="font-semibold uppercase tracking-wider text-[10px]">{priorityGap.domain}</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Remediation needed to achieve Proficient (&ge;75%) status.
                  </p>
                </div>
              ) : (profile?.assessedTopicsCount || 0) === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">Not Yet Assessed</p>
                  <p className="text-[11px] text-slate-500">Complete an assessment to identify competency gaps.</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center space-y-1">
                  <CheckCircle size={20} className="text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-950">Proficient Across Evaluated Topics</p>
                  <p className="text-[11px] text-emerald-800">All evaluated topics meet or exceed 75% proficiency threshold.</p>
                </div>
              )}
            </div>

            <Button variant="primary" size="sm" className="w-full mt-4" onClick={() => navigate('/student/passport')}>
              Open Full Passport & Evidence &rarr;
            </Button>
          </Card>
        </div>
      </div>

      {/* DUAL RECOMMENDED LEARNING SECTION (iGOT + NSSTA/TPAC) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Verified Dual Recommendations</span>
              <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                iGOT + NSSTA/TPAC
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Matched deterministically to your priority gap: <span className="font-semibold text-slate-700">{priorityGap?.topicName || 'General Statistics'}</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/passport')}>
            View Passport Recommendations &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* iGOT Recommendation Card */}
          <Card className="p-5 border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  iGoT Karmayogi Catalog
                </span>
              </div>
              {dualRecommendations?.igotCourse ? (
                <>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {dualRecommendations.igotCourse.course_name || dualRecommendations.igotCourse.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {dualRecommendations.igotCourse.summary || dualRecommendations.igotCourse.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <span>Provider: {dualRecommendations.igotCourse.provider || dualRecommendations.igotCourse.organisation || 'iGoT Karmayogi'}</span>
                    <span>Duration: {dualRecommendations.igotCourse.duration || 'Self-paced'}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">No matching iGoT course found in the current catalog.</p>
              )}
            </div>

            {(dualRecommendations?.igotCourse?.igot_url || dualRecommendations?.igotCourse?.source_url) && (
              <a
                href={dualRecommendations.igotCourse.igot_url || dualRecommendations.igotCourse.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 mt-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Access iGOT Karmayogi Course <ExternalLink size={13} />
              </a>
            )}
          </Card>

          {/* NSSTA / TPAC Recommendation Card */}
          <Card className="p-5 border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  NSSTA / TPAC MoSPI Training
                </span>
                {dualRecommendations?.nsstaProgramme && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                )}
              </div>
              {dualRecommendations?.nsstaProgramme ? (
                <>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{dualRecommendations.nsstaProgramme.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{dualRecommendations.nsstaProgramme.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span>Org: {dualRecommendations.nsstaProgramme.organisation}</span>
                    <span>Duration: {dualRecommendations.nsstaProgramme.duration}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">No verified NSSTA / TPAC programme mapped yet.</p>
              )}
            </div>

            {dualRecommendations?.nsstaProgramme && (
              <a
                href={dualRecommendations.nsstaProgramme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 mt-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                View Official NSSTA Programme <ExternalLink size={13} />
              </a>
            )}
          </Card>
        </div>
      </div>

      {/* Grounded Practice Q&A Section */}
      <div className="mb-8">
        <ErrorBoundary fallbackTitle="Could not render Grounded Practice Q&A">
          <GroundedQAComponent competencyGap={priorityGap?.topicName || 'Data Validation'} />
        </ErrorBoundary>
      </div>

      <SkillLensAssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </DashboardLayout>
  );
}
