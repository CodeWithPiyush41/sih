import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIClient } from '@/lib/api/ai.client';
import { SkillChart } from '@/components/skills/SkillChart';
import { CheckCircle, AlertTriangle, BookOpen, FileText, ArrowRight, ArrowLeft, RotateCcw, GitMerge, Check, X, ShieldCheck, Eye } from 'lucide-react';

export function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AIClient.getAssessmentDetails(id!);
      setAssessment(data.assessment);
      setQuestions(data.questions || []);
      const isRetry = window.location.search.includes('retry=true');
      if (!isRetry && data.latestAttempt) {
        setAttemptResult(data.latestAttempt);
      } else {
        setAttemptResult(null);
      }
    } catch (err: any) {
      console.error('Failed to load assessment:', err);
      setError(err?.message || 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!id || questions.length === 0) return;
    setSubmitting(true);
    try {
      const payloadAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || undefined,
      }));

      const res = await AIClient.submitAssessmentAttempt(id, payloadAnswers);
      setAttemptResult(res);
    } catch (err: any) {
      console.error('Failed to submit assessment:', err);
      alert(`Submission error: ${err?.message || 'Failed to evaluate assessment.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading assessment questions...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout role="student">
        <Card className="p-8 text-center max-w-lg mx-auto border-rose-200 bg-rose-50/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Assessment Not Available</h3>
          <p className="text-xs text-slate-600 mb-4">{error || 'Unable to load assessment details.'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/assessments')}>
            Return to Assessments
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  // RESULT VIEW AFTER SUBMISSION
  if (attemptResult) {
    const dynamicSkillScores = (attemptResult.topicPerformance || []).map((tp: any) => ({
      topicId: tp.topic,
      topicName: tp.topic,
      score: tp.scorePercent,
      scorePercent: tp.scorePercent,
      trend: tp.scorePercent >= 75 ? 'up' : tp.scorePercent < 50 ? 'down' : 'flat',
    }));

    return (
      <DashboardLayout role="student">
        <PageHeader
          title="Assessment Evaluation Results"
          subtitle={`Verified assessment results for ${assessment.title}`}
        />

        {/* Top 3 Primary Post-Assessment Options Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Test Evaluation Completed
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Show Answers Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 shadow-xs"
              onClick={() => {
                document.getElementById('answers-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Eye size={15} />
              Show Answers
            </Button>

            {/* 2. Learning Path Button */}
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
              onClick={() => navigate('/student/learning-path')}
            >
              <GitMerge size={15} />
              Learning Path
            </Button>

            {/* 3. Retry Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 shadow-xs"
              onClick={() => {
                setAttemptResult(null);
                setSelectedAnswers({});
                setCurrentIdx(0);
              }}
            >
              <RotateCcw size={15} />
              Retry Assessment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white to-slate-50 border border-slate-200">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-3xl mb-4 border ${
              attemptResult.percentage >= 75
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : attemptResult.percentage >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}>
              {attemptResult.percentage}%
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {attemptResult.percentage >= 75 ? 'Proficient' : attemptResult.percentage >= 50 ? 'Developing' : 'Needs Development'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Score: {attemptResult.score} / {attemptResult.maxScore} ({attemptResult.correctCount} of {attemptResult.totalQuestions} Correct)
            </p>

            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                className="w-full text-xs font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                onClick={() => {
                  document.getElementById('answers-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Eye size={14} className="mr-1.5" /> Show Answers
              </Button>
              <Button
                variant="primary"
                className="w-full text-xs font-bold bg-primary hover:bg-primary/90"
                onClick={() => navigate('/student/learning-path')}
              >
                <GitMerge size={14} className="mr-1.5" /> Learning Path
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
                onClick={() => {
                  setAttemptResult(null);
                  setSelectedAnswers({});
                  setCurrentIdx(0);
                }}
              >
                <RotateCcw size={14} className="mr-1.5" /> Retry Assessment
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">Competency Breakdown</h3>
            <SkillChart scores={dynamicSkillScores} />
          </div>
        </div>

        {/* Question Explanations & Grounded Citations */}
        <div id="answers-section" className="space-y-4 mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              Detailed Answer Key & PDF Evidence
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {attemptResult.evaluatedAnswers?.length || 0} Questions Evaluated
            </span>
          </div>

          {attemptResult.evaluatedAnswers?.map((ans: any, idx: number) => {
            const questionOpts = ans.options || [];
            return (
              <Card key={ans.questionId || idx} className={`p-6 border transition-all ${
                ans.isCorrect ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-rose-200/80 bg-rose-50/20'
              }`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      ans.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{ans.competencyArea}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    {ans.isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                        <Check size={14} /> Correct (+{ans.marksAwarded} mark)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-200">
                        <X size={14} /> Incorrect (0 marks)
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-semibold text-slate-900 mb-4">{ans.questionText}</h4>

                {/* Render Option Choices with highlights */}
                {questionOpts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {questionOpts.map((opt: any, oIdx: number) => {
                      const isUserChoice = opt.id === ans.selectedOptionId;
                      const isCorrectChoice = opt.isCorrect || opt.id === ans.correctOptionId;

                      let optBg = 'bg-white border-slate-200 text-slate-700';
                      if (isCorrectChoice) {
                        optBg = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold ring-1 ring-emerald-300';
                      } else if (isUserChoice && !isCorrectChoice) {
                        optBg = 'bg-rose-50 border-rose-300 text-rose-900 font-medium line-through';
                      }

                      return (
                        <div key={opt.id || oIdx} className={`p-3 rounded-lg border text-xs flex items-center justify-between ${optBg}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                              isCorrectChoice ? 'bg-emerald-600 text-white' : isUserChoice ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt.optionText}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUserChoice && (
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isCorrectChoice ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                              }`}>
                                Your Choice
                              </span>
                            )}
                            {isCorrectChoice && (
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Explanation:</span>
                    <span className="text-slate-600 leading-relaxed">{ans.explanation}</span>
                  </div>
                  {ans.evidenceSnippet && (
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 min-w-[100px]">Evidence Excerpt:</span>
                      <span className="italic text-slate-500">"{ans.evidenceSnippet}"</span>
                    </div>
                  )}
                  {ans.pageStart && (
                    <div className="flex items-center gap-1.5 text-indigo-700 font-medium pt-1">
                      <FileText size={13} />
                      <span>Source Citation: Page {ans.pageStart}{ans.pageEnd && ans.pageEnd !== ans.pageStart ? `-${ans.pageEnd}` : ''}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Bottom Toolbar with 3 options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6 bg-slate-50 p-4 rounded-xl border">
            <span className="text-xs font-semibold text-slate-600">Choose your next step:</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Eye size={14} className="mr-1.5" /> Back to Top
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-primary hover:bg-primary/90"
                onClick={() => navigate('/student/learning-path')}
              >
                <GitMerge size={14} className="mr-1.5" /> Learning Path
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
                onClick={() => {
                  setAttemptResult(null);
                  setSelectedAnswers({});
                  setCurrentIdx(0);
                }}
              >
                <RotateCcw size={14} className="mr-1.5" /> Retry Assessment
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ACTIVE ASSESSMENT TEST-TAKING VIEW
  const currentQ = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;
  const isAnswered = Boolean(selectedAnswers[currentQ?.id]);
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/assessments')}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Assessments
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <ShieldCheck size={15} />
            <span>AI Evidence Grounded Assessment</span>
          </div>
        </div>

        <Card className="p-6 md:p-8 border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{assessment.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {assessment.materialTitle ? `Source Material: ${assessment.materialTitle}` : 'Official Competency Evaluation'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">Question {currentIdx + 1} of {questions.length}</span>
              <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Question */}
          {currentQ && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  {currentQ.competencyArea || 'Multiple Choice Question'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentQ.questionText}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options?.map((opt: any) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-medium ring-2 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white text-slate-500'
                      }`}>
                        {isSelected ? <Check size={12} /> : String.fromCharCode(65 + (opt.optionOrder - 1 || 0))}
                      </div>
                      <span className="text-sm leading-relaxed">{opt.optionText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                <Button
                  variant="outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Previous
                </Button>

                <div className="text-xs text-slate-500 font-medium">
                  {answeredCount} of {questions.length} Answered
                </div>

                {!isLastQ ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="flex items-center gap-1.5"
                  >
                    Next Question <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    disabled={submitting}
                    onClick={handleSubmitAssessment}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submitting ? 'Evaluating...' : 'Submit Assessment'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
