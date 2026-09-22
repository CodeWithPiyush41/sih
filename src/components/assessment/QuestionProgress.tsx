interface QuestionProgressProps {
  currentIndex: number;
  totalQuestions: number;
}

export function QuestionProgress({ currentIndex, totalQuestions }: QuestionProgressProps) {
  const percentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1.5">
        <span>
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <span>{percentage}% Completed</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
