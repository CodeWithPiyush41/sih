import { Award, Building2, MapPin, Briefcase, ArrowUpRight, Printer, CheckCircle2, AlertTriangle, AlertCircle, Minus } from 'lucide-react';
import type { UserProfile } from '@/lib/auth/auth';
import type { TopicScore } from '@/lib/types';
import { getCompetencyTier, calculateOverallScore } from '@/lib/competency/getCompetencyTier';
import { CompetencyTierLegend } from '@/components/ui/CompetencyTierLegend';

interface CompetencyPassportCardProps {
  profile: UserProfile | null;
  competencies: TopicScore[];
  identifiedGaps?: string[];
  growthHistory?: { initialScore: number; currentScore: number; topic: string }[];
}

export function CompetencyPassportCard({
  profile,
  competencies,
  identifiedGaps = ['Data Validation', 'Sampling Methods'],
  growthHistory = [
    { topic: 'Data Validation', initialScore: 38, currentScore: 67 },
  ],
}: CompetencyPassportCardProps) {
  const overallScore = calculateOverallScore(competencies.map((c) => c.scorePercent));
  const overallTier = getCompetencyTier(overallScore);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-dark to-slate-900 p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-accent text-xl font-bold">
              {profile?.fullName?.charAt(0) || 'O'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                  OFFICIAL COMPETENCY PASSPORT
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">{profile?.fullName || 'Rahul Sharma'}</h2>
              <p className="text-xs text-slate-300">{profile?.designation || 'Statistical Officer'}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-2">
            <button
              onClick={handlePrint}
              className="print:hidden text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 border border-white/20 transition-colors"
            >
              <Printer size={14} />
              Export Passport PDF
            </button>

            <div className="text-left sm:text-right text-xs space-y-1 text-slate-300">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Building2 size={14} className="text-accent" />
                <span>{profile?.departmentMdo || 'Ministry of Statistics & Programme Implementation'}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Briefcase size={14} className="text-accent" />
                <span>Experience: {profile?.yearsExperience != null ? `${profile.yearsExperience} years` : 'Not provided'}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <MapPin size={14} className="text-accent" />
                <span>{profile?.location || 'New Delhi'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passport Body */}
      <div className="p-6 space-y-6">
        {/* Tier Legend */}
        <CompetencyTierLegend />

        {/* Overall Summary Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Overall Competency Score</span>
            <span className="text-2xl font-bold text-slate-900">
              {overallScore != null ? `${overallScore}%` : 'Not yet evaluated'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Overall Tier</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 bg-${overallTier.color}-50 text-${overallTier.color}-700 border-${overallTier.color}-200`}>
              {overallTier.label}
            </span>
          </div>
        </div>

        {/* Competency Profile Breakdown */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Verified Competency Profile
          </h3>

          {competencies.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
              No competency assessment data recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {competencies.map((comp) => {
                const tier = getCompetencyTier(comp.scorePercent);
                return (
                  <div
                    key={comp.topicId}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{comp.topicName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {comp.questionsCorrect} of {comp.questionsAnswered} evaluation items correct
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-slate-900 block">
                        {comp.scorePercent != null ? `${comp.scorePercent}%` : 'N/A'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5 bg-slate-100 text-slate-700 border-slate-200">
                        {tier.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Identified Development Areas */}
        {identifiedGaps.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Identified Priority Development Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {identifiedGaps.map((gap, i) => (
                <span
                  key={gap}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {i + 1}. {gap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning & Reassessment Progress */}
        {growthHistory.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Competency Growth & Reassessment Trajectory
            </h3>
            <div className="space-y-2">
              {growthHistory.map((item, idx) => {
                const diff = item.currentScore - item.initialScore;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.topic}</p>
                        <p className="text-[11px] text-slate-600">
                          Initial Assessment: <span className="font-semibold">{item.initialScore}%</span> &rarr; Targeted iGOT Learning &rarr; Reassessment: <span className="font-semibold text-emerald-700">{item.currentScore}%</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100/80 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                      <ArrowUpRight size={14} />
                      <span>+{diff} percentage points</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
