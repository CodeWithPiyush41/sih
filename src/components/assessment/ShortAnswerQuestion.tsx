import { Question } from '@/types';

interface ShortAnswerQuestionProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export function ShortAnswerQuestion({ question, value, onChange }: ShortAnswerQuestionProps) {
  const maxLength = 500;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Your Answer</label>
        <span className={`text-xs ${value.length > maxLength ? 'text-red-500' : 'text-slate-500'}`}>
          {value.length} / {maxLength} characters
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full min-h-[200px] p-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs resize-y"
      />
    </div>
  );
}
