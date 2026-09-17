import type { StudentCourseSummary } from '@/lib/types';
import { Badge } from '@/components/Badge';

interface WeakAreaCalloutProps {
  summary: StudentCourseSummary;
}

export function WeakAreaCallout({ summary }: WeakAreaCalloutProps) {
  if (!summary.weakestTopic || summary.weakestTopic.scorePercent >= 75) {
    return null;
  }

  const { weakestTopic, recommendedReviewOrder } = summary;
  const isGap = weakestTopic.scorePercent < 40;

  return (
    <section className="bg-surface border border-border rounded-panel p-6">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-h3 text-ink">Weakest area</h3>
        <Badge variant={isGap ? 'gap' : 'neutral'}>
          {isGap ? 'Needs review' : 'Developing'}
        </Badge>
      </div>
      <p className="text-body text-ink-secondary mb-4">
        <span className="font-mono text-ink">{weakestTopic.scorePercent}%</span> on{' '}
        <span className="text-ink">{weakestTopic.topicName}</span>
        {' — '}
        {weakestTopic.questionsCorrect} of {weakestTopic.questionsAnswered} questions correct.
      </p>
      {recommendedReviewOrder.length > 0 && (
        <div>
          <p className="text-caption text-ink-muted mb-2">
            Reviewing these topics in order may help before re-attempting:
          </p>
          <ol className="flex flex-col gap-1">
            {recommendedReviewOrder.map((topic, i) => (
              <li key={topic} className="flex items-center gap-2 text-body text-ink-secondary">
                <span className="text-caption text-ink-muted font-mono w-5">
                  {i + 1}.
                </span>
                {topic}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
