import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { SkillScore } from '@/types';

interface SkillCardProps {
  score: SkillScore;
}

export function SkillCard({ score }: SkillCardProps) {
  const getStatusBadge = () => {
    if (score.score >= 75) return <Badge variant="success">Mastered</Badge>;
    if (score.score >= 50) return <Badge variant="warning">Developing</Badge>;
    return <Badge variant="danger">Needs Practice</Badge>;
  };

  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900 text-sm">{score.topicName}</h4>
          {getStatusBadge()}
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-slate-900">{score.score}%</span>
          <span className="text-xs text-slate-500 capitalize">
            Trend: {score.trend}
          </span>
        </div>

        <ProgressBar value={score.score} color="auto" />
      </div>
    </Card>
  );
}
