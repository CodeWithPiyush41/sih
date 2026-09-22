import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Question } from '@/types';

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questions: Question[];
  answers: Record<string, string>;
  markedForReview: Set<string>;
}

export function ConfirmSubmitModal({
  isOpen,
  onClose,
  onConfirm,
  questions,
  answers,
  markedForReview,
}: ConfirmSubmitModalProps) {
  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const markedCount = markedForReview.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Submit Assessment?</h2>
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Answered Questions:</span>
              <span className="font-semibold text-slate-900">{answeredCount}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Unanswered Questions:</span>
              <span className={`font-semibold ${unansweredCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {unansweredCount}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Marked for Review:</span>
              <span className={`font-semibold ${markedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {markedCount}
              </span>
            </div>
          </div>
          
          {unansweredCount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm mb-6">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <p>You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Are you sure you want to submit?</p>
            </div>
          )}
          
          {!unansweredCount && (
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to submit your assessment? You cannot change your answers after submitting.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Continue Assessment
            </Button>
            <Button variant="primary" className="flex-1" onClick={onConfirm}>
              Submit Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
