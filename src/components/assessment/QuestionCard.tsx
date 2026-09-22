import { MCQOptions } from './MCQOptions';
import { Badge } from '@/components/ui/Badge';
import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  selectedOptionId?: string;
  onSelectOption: (id: string) => void;
}

export function QuestionCard({ question, selectedOptionId, onSelectOption }: QuestionCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={question.difficulty === 'Hard' ? 'danger' : question.difficulty === 'Medium' ? 'warning' : 'primary'}>
          {question.difficulty.toUpperCase()}
        </Badge>
        <span className="text-xs text-slate-400 capitalize">{question.type.replace('_', ' ')}</span>
      </div>

      <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
        {question.text}
      </h2>

      {question.options && (
        <MCQOptions
          options={question.options}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      )}
    </div>
  );
}
