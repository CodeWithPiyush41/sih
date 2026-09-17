interface QuestionReviewCardProps {
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending_review' | 'approved' | 'rejected';
  topicName: string;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  editable?: boolean;
  onPromptChange?: (value: string) => void;
  onOptionChange?: (optionId: string, text: string) => void;
  onCorrectChange?: (optionId: string) => void;
}

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export function QuestionReviewCard({
  prompt,
  options,
  correctOptionId,
  difficulty,
  status,
  topicName,
  onApprove,
  onReject,
  onEdit,
  editable = false,
  onPromptChange,
  onOptionChange,
  onCorrectChange,
}: QuestionReviewCardProps) {
  return (
    <div className="bg-surface border border-border rounded-panel p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="neutral">{topicName}</Badge>
        <Badge variant="neutral">{difficulty}</Badge>
        {status === 'approved' && <Badge variant="strong">Approved</Badge>}
        {status === 'pending_review' && <Badge variant="pending">Pending review</Badge>}
        {status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
      </div>

      <div className="mb-4">
        {editable ? (
          <Input
            label="Question prompt"
            value={prompt}
            onChange={(e) => onPromptChange?.(e.target.value)}
          />
        ) : (
          <p className="text-body text-ink mb-3">{prompt}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {options.map((opt) => {
          const isCorrect = opt.id === correctOptionId;
          return (
            <div
              key={opt.id}
              className={`flex items-center gap-3 rounded-btn border px-3 py-2 ${
                isCorrect
                  ? 'border-strong bg-strong-tint'
                  : 'border-border bg-surface'
              }`}
            >
              {editable ? (
                <>
                  <input
                    type="radio"
                    name={`correct-${prompt}`}
                    checked={isCorrect}
                    onChange={() => onCorrectChange?.(opt.id)}
                    className="accent-signal shrink-0"
                    aria-label={`Mark option ${opt.id} as correct`}
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => onOptionChange?.(opt.id, e.target.value)}
                    className="border-transparent bg-transparent"
                  />
                </>
              ) : (
                <>
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-badge text-caption font-mono shrink-0 ${
                      isCorrect
                        ? 'bg-strong text-white'
                        : 'bg-bg text-ink-muted border border-border'
                    }`}
                  >
                    {opt.id.toUpperCase()}
                  </span>
                  <span className="text-body text-ink-secondary">{opt.text}</span>
                  {isCorrect && (
                    <Badge variant="strong">Correct</Badge>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {status !== 'approved' && onApprove && (
          <Button variant="primary" onClick={onApprove} className="text-caption py-2">
            Approve
          </Button>
        )}
        {status !== 'rejected' && onReject && (
          <Button variant="destructive" onClick={onReject} className="text-caption py-2">
            Reject
          </Button>
        )}
        {onEdit && (
          <Button variant="secondary" onClick={onEdit} className="text-caption py-2">
            {editable ? 'Done' : 'Edit'}
          </Button>
        )}
      </div>
    </div>
  );
}
