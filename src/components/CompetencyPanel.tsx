import type { TopicScore } from '@/lib/types';
import { CompetencyBar } from '@/components/CompetencyBar';

interface CompetencyPanelProps {
  title: string;
  overallScorePercent: number;
  topicScores: TopicScore[];
}

export function CompetencyPanel({
  title,
  overallScorePercent,
  topicScores,
}: CompetencyPanelProps) {
  return (
    <section className="bg-surface border border-border rounded-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-h3 text-ink">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-data-lg text-ink font-mono">{overallScorePercent}</span>
          <span className="text-body-sm text-ink-muted">%</span>
        </div>
      </div>
      <div className="mt-4 mb-4 border-t border-border" />
      <div className="flex flex-col gap-2">
        {topicScores.length === 0 ? (
          <p className="text-body text-ink-muted">No competency data yet.</p>
        ) : (
          topicScores.map((ts) => (
            <CompetencyBar
              key={ts.topicId}
              label={ts.topicName}
              scorePercent={ts.scorePercent}
              questionsAnswered={ts.questionsAnswered}
              questionsCorrect={ts.questionsCorrect}
            />
          ))
        )}
      </div>
    </section>
  );
}
