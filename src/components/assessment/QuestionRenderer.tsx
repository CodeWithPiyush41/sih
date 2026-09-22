import { Question } from '@/types';
import { MCQOptions } from './MCQOptions';
import { ShortAnswerQuestion } from './ShortAnswerQuestion';
import { CodeQuestion } from './CodeQuestion';
import { Badge } from '@/components/ui/Badge';

interface QuestionRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  if (question.type === 'coding') {
    return <CodeQuestion question={question} value={value} onChange={onChange} />;
  }

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

      {question.type === 'mcq' && question.options && (
        <MCQOptions
          options={question.options}
          selectedOptionId={value}
          onSelectOption={onChange}
        />
      )}

      {question.type === 'short_answer' && (
        <ShortAnswerQuestion question={question} value={value || ''} onChange={onChange} />
      )}
    </div>
  );
}
