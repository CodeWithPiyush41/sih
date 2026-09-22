import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialMinutes: number;
  onTimeUp?: () => void;
}

export function Timer({ initialMinutes, onTimeUp }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const isLowTime = secondsLeft < 120; // less than 2 mins

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
        isLowTime
          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
          : 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      <Clock size={16} />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
