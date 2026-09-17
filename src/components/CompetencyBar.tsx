import { useEffect, useRef, useState } from 'react';

interface CompetencyBarProps {
  label: string;
  scorePercent: number;
  questionsAnswered?: number;
  questionsCorrect?: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--strong)';
  if (score < 40) return 'var(--gap)';
  return 'var(--neutral-score)';
}

export function CompetencyBar({
  label,
  scorePercent,
  questionsAnswered,
  questionsCorrect,
}: CompetencyBarProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const color = scoreColor(scorePercent);
  const clamped = Math.min(100, Math.max(0, scorePercent));

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-body text-ink-secondary">{label}</span>
        <div className="flex items-baseline gap-2">
          {questionsAnswered !== undefined && questionsCorrect !== undefined && (
            <span className="text-caption text-ink-muted font-mono">
              {questionsCorrect}/{questionsAnswered}
            </span>
          )}
          <span className="text-data-inline text-ink font-mono">{scorePercent}%</span>
        </div>
      </div>
      <div
        className="h-2 rounded-badge border border-border bg-bg overflow-hidden"
        role="progressbar"
        aria-valuenow={scorePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} competency score`}
      >
        <div
          className={animated ? '' : 'animate-bar-fill'}
          style={{
            width: animated ? `${clamped}%` : 0,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            ...(animated ? {} : { ['--bar-target' as string]: `${clamped}%` }),
          }}
        />
      </div>
    </div>
  );
}
