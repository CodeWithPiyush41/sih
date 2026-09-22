interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'auto';
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  color = 'auto',
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const getColorClass = () => {
    if (color !== 'auto') {
      const colors = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-emerald-600',
        warning: 'bg-amber-500',
        danger: 'bg-red-600',
      };
      return colors[color];
    }
    if (percentage >= 75) return 'bg-emerald-600';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-600';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-medium text-slate-600">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
