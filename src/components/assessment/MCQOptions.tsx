import { QuestionOption } from '@/types';
import { Check } from 'lucide-react';

interface MCQOptionsProps {
  options: QuestionOption[];
  selectedOptionId?: string;
  onSelectOption: (id: string) => void;
  disabled?: boolean;
}

export function MCQOptions({ options, selectedOptionId, onSelectOption, disabled }: MCQOptionsProps) {
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, idx) => {
        const isSelected = selectedOptionId === option.id;
        const letter = letters[idx] || String(idx + 1);

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectOption(option.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-primary/20 border-primary text-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isSelected ? <Check size={16} /> : letter}
            </span>
            <span className="text-sm font-medium leading-relaxed pt-0.5">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}
