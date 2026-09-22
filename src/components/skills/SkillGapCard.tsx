import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkillScore } from '@/types';

interface SkillGapCardProps {
  weakArea?: SkillScore | null;
  onPractice: (topicId: string) => void;
}

export function SkillGapCard({ weakArea, onPractice }: SkillGapCardProps) {
  if (!weakArea || (!weakArea.topicName && !(weakArea as any)?.topic_name && !(weakArea as any)?.name)) {
    return (
      <Card className="border-slate-200 bg-slate-50/70 p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
          <AlertTriangle size={20} />
        </div>
        <h4 className="font-semibold text-slate-800 text-sm mb-1">No priority gap identified yet.</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Great job! Complete further assessments to identify specific competency development areas.
        </p>
      </Card>
    );
  }

  const topicName = weakArea.topicName || (weakArea as any)?.topic_name || (weakArea as any)?.name || 'Competency Area';
  const topicId = weakArea.topicId || (weakArea as any)?.topic_id || (weakArea as any)?.id || 'general';
  const score = weakArea.score ?? (weakArea as any)?.scorePercent ?? (weakArea as any)?.score_percent ?? 0;

  return (
    <Card className="border-amber-200 bg-amber-50/40 h-full flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-slate-900 text-base truncate">{topicName}</h4>
            <Badge variant="danger">{score}% Score</Badge>
          </div>

          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Your performance indicates that this concept needs more practice to build confidence.
          </p>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPractice(topicId)}
          >
            <span>Practice {topicName}</span>
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
