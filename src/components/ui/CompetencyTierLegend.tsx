import { CheckCircle2, AlertTriangle, AlertCircle, Minus } from 'lucide-react';

export function CompetencyTierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
      <span className="font-semibold text-slate-800">Tier Legend:</span>
      <div className="flex items-center gap-1.5 text-emerald-700">
        <CheckCircle2 size={14} className="text-emerald-500" />
        <span>75%+ — Proficient</span>
      </div>
      <div className="flex items-center gap-1.5 text-amber-700">
        <AlertTriangle size={14} className="text-amber-500" />
        <span>50–74% — Developing</span>
      </div>
      <div className="flex items-center gap-1.5 text-rose-700">
        <AlertCircle size={14} className="text-rose-500" />
        <span>&lt;50% — Needs Development</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500">
        <Minus size={14} className="text-slate-400" />
        <span>Unevaluated</span>
      </div>
    </div>
  );
}
