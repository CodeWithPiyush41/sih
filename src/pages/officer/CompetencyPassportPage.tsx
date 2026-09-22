import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkillChart } from '@/components/skills/SkillChart';
import { CompetencyService, CompetencyProfileOverview } from '@/lib/services/competency.service';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  ShieldCheck,
  Award,
  Target,
  BookOpen,
  ExternalLink,
  Building2,
  Briefcase,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export function CompetencyPassportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompetencyProfileOverview | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await CompetencyService.getOfficerCompetencyProfile(user?.id);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load competency passport profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading Official Competency Passport...</p>
        </div>
      </DashboardLayout>
    );
  }

  const {
    overallScorePercent,
    overallStatusTier,
    domains,
    priorityGap,
    dualRecommendations,
    assessmentAttemptsCount,
  } = profile || {};

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
        title="Official Competency Passport"
        subtitle="Unified single source of truth for statistical officer capability, gap evidence, recommendations, and growth."
      />

      {/* SECTION A & PROFILE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-6">
        <Card className="lg:col-span-1 flex flex-col justify-between p-6 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border border-slate-200">
          <div>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl border border-primary/20">
                {user?.fullName?.charAt(0) || 'O'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{user?.fullName || 'Statistical Officer'}</h3>
                <p className="text-xs text-slate-500">{user?.designation || 'Statistical Officer'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 mb-6">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-primary" />
                <span>{user?.departmentMdo || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-primary" />
                <span>{user?.yearsExperience != null ? `${user.yearsExperience} years experience` : 'Not provided'}</span>
              </div>
            </div>

            {/* Overall Status Badge */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Competency Status</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {overallScorePercent !== null ? `${overallScorePercent}%` : 'Not Evaluated'}
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  overallStatusTier === 'Proficient' ? 'bg-emerald-500' : overallStatusTier === 'Developing' ? 'bg-amber-500' : overallStatusTier === 'Needs Development' ? 'bg-rose-500' : 'bg-slate-300'
                }`} />
                <span className="text-xs font-bold text-slate-700">{overallStatusTier}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Competency Passport Verification ID: <span className="font-mono text-slate-600 font-semibold">{user?.id ? `SKL-${user.id.slice(0, 8).toUpperCase()}` : 'SKL-PROTOTYPE'}</span>
          </div>
        </Card>

        {/* SECTION B: FOUR-DOMAIN COMPETENCY MATRIX */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Four-Domain Competency Matrix</h3>
                <p className="text-xs text-slate-500">Evaluation breakdown across statistical, technical, digital governance & managerial domains</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                SIH26101 Taxonomy
              </span>
            </div>
            <SkillChart scores={dynamicChartScores} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 mt-4 text-center">
            {domains?.map((dom) => (
              <div key={dom.domain} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-600 truncate">{dom.title.split(' ')[0]}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {dom.averagePercent !== null ? `${dom.averagePercent}%` : '⚪ Not evaluated'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION C & D: EVIDENCE-BASED GAP ANALYSIS & PRIORITY GAPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Priority Skill Gap</h3>
              <p className="text-xs text-slate-500">Highest-priority area requiring development</p>
            </div>
          </div>

          {priorityGap ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-amber-950 text-base">{priorityGap.topicName}</h4>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {priorityGap.scorePercent}% Score
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed mt-1">
                  Status: <span className="font-semibold">{priorityGap.statusTier}</span>. Focused remediation recommended.
                </p>
                {priorityGap.evidenceSnippet && (
                  <p className="text-[11px] text-amber-700 italic mt-2 bg-white/80 p-2 rounded border border-amber-200">
                    "{priorityGap.evidenceSnippet}"
                  </p>
                )}
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate('/student/assessments')}>
                Launch Targeted Reassessment
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Priority Gap Identified</p>
              <p className="text-xs text-slate-500 mt-1">
                Complete competency assessments to evaluate priority skill gaps.
              </p>
            </div>
          )}
        </Card>

        {/* SECTION E: RECOMMENDED TRAINING (iGOT + NSSTA) */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Dual Training Recommendations</h3>
              <p className="text-xs text-slate-500">iGOT Karmayogi + NSSTA / TPAC programmes</p>
            </div>
          </div>

          <div className="space-y-3">
            {dualRecommendations?.igot && dualRecommendations.igot.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-2 py-0.5 rounded">
                    iGoT Karmayogi Catalog
                  </span>
                  {(dualRecommendations.igot[0].url && dualRecommendations.igot[0].url !== '#') && (
                    <a
                      href={dualRecommendations.igot[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">{dualRecommendations.igot[0].title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{dualRecommendations.igot[0].provider}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-500 italic">
                No matching iGoT course found in the current catalog.
              </div>
            )}

            {dualRecommendations?.nssta && dualRecommendations.nssta.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded">
                    NSSTA / TPAC
                  </span>
                  <a
                    href={dualRecommendations.nssta[0].url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink size={12} />
                  </a>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">{dualRecommendations.nssta[0].title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{dualRecommendations.nssta[0].provider}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-500 italic">
                No verified NSSTA programme mapped yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* SECTION F: GROWTH & REASSESSMENT TRAJECTORY */}
      <Card className="p-6 border-slate-200 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Growth & Reassessment Trajectory</h3>
            <p className="text-xs text-slate-500">Historical competency score progression based on verified assessment evaluation attempts</p>
          </div>
        </div>

        {(assessmentAttemptsCount || 0) > 0 ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-3xl font-extrabold text-slate-900">{overallScorePercent}%</div>
            <p className="text-xs text-slate-600 font-medium">Verified evaluation from {assessmentAttemptsCount} assessment attempt(s)</p>
            <p className="text-[11px] text-slate-400">Complete additional reassessments to visualize multi-point growth progression timeline.</p>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Assessment History Available Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Take assessment quizzes to track your competency trajectory over time.
            </p>
          </div>
        )}
      </Card>

      {/* SECTION H: VERIFICATION & EXPORT */}
      <Card className="p-6 border-slate-200 shadow-sm bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Verification Status: Prototype</span>
          </div>
          <p className="text-sm font-bold text-white">
            Passport Verification ID: <span className="font-mono text-amber-300">SKL-{(user?.id || '00000000').slice(0, 8).toUpperCase()}</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable to authenticated Supabase profile in the Statistical Officer System.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 print:hidden self-start md:self-auto"
        >
          <FileText size={16} className="mr-1.5" />
          Export Official Passport PDF
        </Button>
      </Card>
    </DashboardLayout>
  );
}
