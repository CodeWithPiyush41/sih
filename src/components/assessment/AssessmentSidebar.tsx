import { Question } from '@/types';
import { Button } from '@/components/ui/Button';

interface AssessmentSidebarProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: Set<string>;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}

export function AssessmentSidebar({
  questions,
  currentIndex,
  answers,
  markedForReview,
  onNavigate,
  onSubmit,
}: AssessmentSidebarProps) {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const markedCount = markedForReview.size;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col h-full">
      <h3 className="font-semibold text-slate-900 mb-4">Assessment Progress</h3>
      
      <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
        <span>{questions.length} Questions</span>
      </div>
      
      <div className="space-y-1 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-emerald-600">Answered:</span>
          <span className="font-medium text-emerald-700">{answeredCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Unanswered:</span>
          <span className="font-medium text-slate-700">{unansweredCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-500">Marked:</span>
          <span className="font-medium text-amber-600">{markedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-8">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!answers[q.id];
          const isMarked = markedForReview.has(q.id);

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              className={`
                relative w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${isAnswered ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
              `}
            >
              {idx + 1}
              {isAnswered && !isCurrent && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              )}
              {isMarked && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <Button
          variant="primary"
          className="w-full"
          onClick={onSubmit}
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}
