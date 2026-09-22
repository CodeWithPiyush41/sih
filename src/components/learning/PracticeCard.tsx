import { Target, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PracticeRecommendation } from '@/types';

interface PracticeCardProps {
  recommendation: PracticeRecommendation;
  onStartPractice: (id: string) => void;
}

export function PracticeCard({ recommendation, onStartPractice }: PracticeCardProps) {
  return (
    <Card hover className="border-primary/20 bg-white">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <Target size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{recommendation.topicName} Practice</h3>
            <p className="text-xs text-slate-500">Targeted remediation module</p>
          </div>
        </div>
        <Badge variant="danger">Previous Score: {recommendation.currentScorePercent}%</Badge>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Focus Concepts
        </p>
        <ul className="space-y-1.5">
          {recommendation.focusConcepts.map((concept, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 size={14} className="text-secondary shrink-0" />
              <span>{concept}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>~{recommendation.estimatedMinutes} Minutes</span>
        </div>
        <span>{recommendation.questionCount} Targeted Questions</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() => onStartPractice(recommendation.id)}
        className="w-full"
      >
        <span>Start Targeted Practice</span>
        <ArrowRight size={14} className="ml-1.5" />
      </Button>
    </Card>
  );
}
