import { LearningStep } from './LearningStep';
import { LearningStepNode } from '@/types';

interface LearningPathProps {
  steps: LearningStepNode[];
  topicName?: string;
}

export function LearningPath({ steps, topicName = 'Data Validation' }: LearningPathProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Personalized Learning Roadmap for {topicName}
          </h3>
          <p className="text-xs text-slate-500">
            Targeted training sequence designed to address identified competency gaps in official statistics.
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-full shrink-0">
            {completedCount} of {totalCount} steps completed
          </div>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No personalized learning path available yet.
        </div>
      ) : (
        <div className="flex flex-col items-center py-4">
          {steps.map((step, idx) => (
            <LearningStep key={step.id} step={step} isLast={idx === steps.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
