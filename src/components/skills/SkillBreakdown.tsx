import { SkillScore } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

interface SkillBreakdownProps {
  scores: SkillScore[];
}

export function SkillBreakdown({ scores }: SkillBreakdownProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-900 text-sm">Detailed Topic Breakdown</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {scores.map((s) => (
          <div key={s.topicId} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-slate-900 text-sm">{s.topicName}</span>
                <Badge variant={s.score >= 75 ? 'success' : s.score >= 50 ? 'warning' : 'danger'}>
                  {s.score}%
                </Badge>
              </div>
              <ProgressBar value={s.score} color="auto" className="max-w-md" />
            </div>

            <div className="text-right text-xs text-slate-500 shrink-0">
              <p className="font-medium text-slate-700">
                {s.score >= 75 ? 'Strong Proficiency' : s.score >= 50 ? 'Moderate Proficiency' : 'Requires Attention'}
              </p>
              <p className="mt-1 text-slate-400 capitalize">Trend: {s.trend}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
