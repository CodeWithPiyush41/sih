import { Award, Clock, FileQuestion, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Assessment } from '@/types';

interface AssessmentCardProps {
  assessment: Assessment;
  onStart: (id: string) => void;
  completedScore?: number;
}

export function AssessmentCard({ assessment, onStart, completedScore }: AssessmentCardProps) {
  const isCompleted = completedScore !== undefined;

  const getDifficultyBadge = (mode: string) => {
    switch (mode) {
      case 'hard':
        return <Badge variant="danger">Hard</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      default:
        return <Badge variant="primary">Normal</Badge>;
    }
  };

  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Award size={18} />
            </div>
            {getDifficultyBadge(assessment.difficulty.toLowerCase())}
          </div>
          {isCompleted && (
            <Badge variant={completedScore >= 70 ? 'success' : 'warning'}>
              Score: {completedScore}%
            </Badge>
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-1">
          {assessment.title}
        </h3>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
          <div className="flex items-center gap-1">
            <FileQuestion size={14} />
            <span>{assessment.questionCount || assessment.questions?.length || assessment.questionIds?.length || 5} Questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{assessment.timeLimitMinutes} mins</span>
          </div>
        </div>
      </div>

      <Button
        variant={isCompleted ? 'outline' : 'primary'}
        size="sm"
        onClick={() => onStart(assessment.id)}
        className="w-full"
      >
        <span>{isCompleted ? 'Review Results' : 'Start Assessment'}</span>
        <ArrowRight size={14} className="ml-1.5" />
      </Button>
    </Card>
  );
}
