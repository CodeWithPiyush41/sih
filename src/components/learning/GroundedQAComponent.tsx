import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckCircle, AlertTriangle, FileText, Sparkles, HelpCircle, ArrowRight, Check, X } from 'lucide-react';

export interface GroundedSourceChunk {
  materialId?: string;
  chunkId?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface GroundedQuestion {
  question: string;
  type: 'mcq' | 'short_answer';
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  expectedAnswer?: string;
  explanation: string;
  competencyArea: string;
  evidenceSnippet?: string;
  sourceChunks?: GroundedSourceChunk[];
}

interface GroundedQAComponentProps {
  competencyGap: string;
  onAnswerEvaluated?: (score: number) => void;
}

export const GroundedQAComponent: React.FC<GroundedQAComponentProps> = ({
  competencyGap,
  onAnswerEvaluated,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasSourceMaterial, setHasSourceMaterial] = useState<boolean | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string>('');
  const [questions, setQuestions] = useState<GroundedQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // User input states
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswerText, setShortAnswerText] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (!competencyGap) {
      setHasSourceMaterial(false);
      setEmptyMessage('No competency gap identified yet.');
      return;
    }
    fetchGroundedQuestions();
  }, [competencyGap]);

  const fetchGroundedQuestions = async () => {
    setLoading(true);
    setSubmitted(false);
    setSelectedOption('');
    setShortAnswerText('');
    setIsCorrect(null);

    try {
      const res = await fetch('/api/ai/grounded-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencyArea: competencyGap }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setHasSourceMaterial(data.hasSourceMaterial);
      setEmptyMessage(data.message || 'No training material is available for practice questions yet.');
      setQuestions(data.questions || []);
      setActiveQuestionIndex(0);
    } catch (err) {
      console.warn('Could not fetch grounded questions:', err);
      setHasSourceMaterial(false);
      setEmptyMessage('No training material is available for practice questions yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = () => {
    if (questions.length === 0) return;
    const currentQ = questions[activeQuestionIndex];

    if (currentQ.type === 'mcq') {
      const selected = currentQ.options?.find(o => o.id === selectedOption);
      const correct = selected ? selected.isCorrect : false;
      setIsCorrect(correct);
      setSubmitted(true);
      if (correct && onAnswerEvaluated) onAnswerEvaluated(100);
    } else {
      const correct = shortAnswerText.trim().length > 15;
      setIsCorrect(correct);
      setSubmitted(true);
      if (correct && onAnswerEvaluated) onAnswerEvaluated(85);
    }
  };

  const currentQ = questions[activeQuestionIndex];

  if (!competencyGap) {
    return (
      <Card className="p-6 text-center border-slate-200">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No competency gap identified yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Complete your competency assessment to receive targeted practice questions.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Grounded Practice Questions</h3>
            <p className="text-xs text-slate-500">Targeted remediation for gap: <span className="font-medium text-slate-700">{competencyGap}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            RAG Evidence-Grounded
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">Retrieving training chunks & generating grounded practice...</p>
        </div>
      ) : !hasSourceMaterial || questions.length === 0 ? (
        <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-700">No Training Material Indexed</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {emptyMessage || 'No training material is available for practice questions yet.'}
          </p>
          <p className="text-[11px] text-slate-400 italic">
            Upload official PDF documents for {competencyGap} in the Training Materials library to enable RAG-grounded Q&A.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question Counter & Source Citation header */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/80 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <BookOpen size={15} className="text-primary" />
              <span>Based on your training material</span>
            </div>
            {currentQ.sourceChunks && currentQ.sourceChunks.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <FileText size={12} className="text-indigo-600" />
                <span>
                  Source: Page {currentQ.sourceChunks[0].pageStart || 1}
                  {currentQ.sourceChunks[0].pageEnd && currentQ.sourceChunks[0].pageEnd !== currentQ.sourceChunks[0].pageStart
                    ? `-${currentQ.sourceChunks[0].pageEnd}`
                    : ''}
                </span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {currentQ.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Question {activeQuestionIndex + 1} of {questions.length}</span>
            </div>
            <h4 className="text-base font-semibold text-slate-900 leading-snug">
              {currentQ.question}
            </h4>
          </div>

          {/* Answer Options or Input */}
          {currentQ.type === 'mcq' && currentQ.options ? (
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                let optionStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800';

                if (submitted) {
                  if (opt.isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium';
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50/80 text-rose-950';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/20';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={submitted}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 ${optionStyle}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                      submitted && opt.isCorrect
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : submitted && isSelected && !opt.isCorrect
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}>
                      {submitted && opt.isCorrect ? <Check size={12} /> : submitted && isSelected && !opt.isCorrect ? <X size={12} /> : opt.id.toUpperCase().slice(-1)}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                disabled={submitted}
                rows={3}
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                placeholder="Write your answer based on the official training material..."
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50"
              />
            </div>
          )}

          {/* Action Button */}
          {!submitted ? (
            <Button
              variant="primary"
              disabled={currentQ.type === 'mcq' ? !selectedOption : !shortAnswerText.trim()}
              onClick={handleCheckAnswer}
              className="w-full"
            >
              Submit Answer
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Feedback Alert */}
              <div className={`p-4 rounded-xl border ${
                isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Incorrect / Incomplete</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed mt-1 text-slate-700">
                  {currentQ.explanation}
                </p>
                {currentQ.expectedAnswer && !isCorrect && (
                  <div className="mt-2 text-xs font-medium text-slate-800 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold">Expected key concepts:</span> {currentQ.expectedAnswer}
                  </div>
                )}
                {currentQ.evidenceSnippet && (
                  <div className="mt-2 text-[11px] text-slate-600 bg-slate-100/80 p-2 rounded border border-slate-200 italic">
                    "<span className="font-medium">Evidence Snippet:</span> {currentQ.evidenceSnippet}"
                  </div>
                )}
              </div>

              {/* Next Question Navigation */}
              {activeQuestionIndex < questions.length - 1 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveQuestionIndex(prev => prev + 1);
                    setSubmitted(false);
                    setSelectedOption('');
                    setShortAnswerText('');
                    setIsCorrect(null);
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <span>Next Question</span>
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <div className="p-3 bg-slate-100 rounded-xl text-center text-xs font-semibold text-slate-700">
                  Completed all practice questions for {competencyGap}.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
