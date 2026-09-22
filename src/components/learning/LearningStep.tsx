import { CheckCircle2, Circle, ArrowDown, Code2, BookOpen, Award, RotateCcw } from 'lucide-react';
import { LearningStepNode } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface LearningStepProps {
  step: LearningStepNode;
  isLast?: boolean;
}

export function LearningStep({ step, isLast = false }: LearningStepProps) {
  const getIcon = () => {
    switch (step.type) {
      case 'concept':
        return <BookOpen size={18} />;
      case 'practice':
        return <Code2 size={18} />;
      case 'quiz':
        return <Award size={18} />;
      case 'reassessment':
        return <RotateCcw size={18} />;
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`w-full max-w-md p-5 rounded-xl border transition-all duration-200 ${
          step.completed
            ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
            : step.current
            ? 'bg-white border-primary ring-2 ring-primary/20 shadow-md'
            : 'bg-white border-slate-200 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                step.completed
                  ? 'bg-emerald-100 text-emerald-700'
                  : step.current
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {getIcon()}
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">{step.title}</h4>
          </div>

          <div>
            {step.completed ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 size={12} />
                Completed
              </Badge>
            ) : step.current ? (
              <Badge variant="primary">In Progress</Badge>
            ) : (
              <Badge variant="neutral">Upcoming</Badge>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 ml-10 mb-2 leading-relaxed">{step.description}</p>

        {step.scorePercent !== undefined && (
          <div className="ml-10 text-xs font-semibold text-slate-700">
            Current Score: <span className="text-primary">{step.scorePercent}%</span>
          </div>
        )}
      </div>

      {!isLast && (
        <div className="my-3 flex flex-col items-center text-slate-300">
          <div className="w-0.5 h-6 bg-slate-300" />
          <ArrowDown size={14} className="text-slate-400 -mt-1" />
        </div>
      )}
    </div>
  );
}
