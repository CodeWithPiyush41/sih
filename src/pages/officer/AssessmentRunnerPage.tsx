import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/Button';
import {
  getCourseById,
  getAssessmentById,
  getQuestionsByIds,
} from '@/lib/data/mockData';
import type { Question } from '@/lib/types';
import { useAssessment } from '@/context/AssessmentContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AssessmentRunnerPage() {
  const { courseId, assessmentId } = useParams<{ courseId: string; assessmentId: string }>();
  const course = getCourseById(courseId ?? '');
  const assessment = getAssessmentById(assessmentId ?? '');
  const navigate = useNavigate();
  const { currentQuestionIndex, answers, setCurrentQuestionIndex, setAnswer, reset } = useAssessment();

  const [submitted, setSubmitted] = useState(false);

  const questions: Question[] = assessment
    ? getQuestionsByIds(assessment.questionIds)
    : [];

  if (!course || !assessment) {
    return (
      <DashboardLayout role="student">
        <p className="text-body text-ink-muted">Assessment not found.</p>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleSubmit = () => {
    // Compute scores client-side against mock correct answers
    const attemptId = `att-${Date.now()}`;
    // In a real app, this would persist to the backend
    // For now, we redirect to results with the attempt ID
    setSubmitted(true);
    reset();
    navigate(`/student/courses/${course.id}/results/${attemptId}`, {
      state: {
        assessmentId: assessment.id,
        answers,
        questionIds: assessment.questionIds,
      },
    });
  };

  if (submitted) {
    return (
      <DashboardLayout role="student">
        <p className="text-body text-ink-muted">Submitting...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <Link
          to={`/student/courses/${course.id}`}
          className="text-body-sm text-signal hover:text-signal-hover"
        >
          Back to {course.name}
        </Link>
      </div>

      <div className="max-w-[42rem]">
        <h1 className="text-h1 text-ink mb-1">{assessment.title}</h1>
        <p className="text-body text-ink-muted mb-6">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 rounded-badge bg-bg border border-border overflow-hidden">
            <div
              className="h-full bg-signal rounded-badge transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-caption text-ink-muted">
              {answeredCount} of {totalQuestions} answered
            </span>
            <span className="text-caption text-ink-muted font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-surface border border-border rounded-panel p-6 mb-6">
          <p className="text-body text-ink mb-4">{currentQuestion.prompt}</p>
          <div className="flex flex-col gap-2">
            {(currentQuestion.options || []).map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswer(currentQuestion.id, opt.id)}
                  className={`flex items-center gap-3 rounded-btn border px-4 py-3 text-left transition-colors duration-150 ${
                    isSelected
                      ? 'border-signal bg-signal-tint text-ink'
                      : 'border-border bg-surface text-ink-secondary hover:border-border-strong'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-badge text-caption font-mono shrink-0 ${
                      isSelected
                        ? 'bg-signal text-white'
                        : 'bg-bg text-ink-muted border border-border'
                    }`}
                  >
                    {opt.id.toUpperCase()}
                  </span>
                  <span className="text-body">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <span className="flex items-center gap-1.5">
              <ChevronLeft size={16} strokeWidth={1.5} />
              Previous
            </span>
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions}
            >
              Submit assessment
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!answers[currentQuestion.id]}
            >
              <span className="flex items-center gap-1.5">
                Next
                <ChevronRight size={16} strokeWidth={1.5} />
              </span>
            </Button>
          )}
        </div>

        {isLastQuestion && answeredCount < totalQuestions && (
          <p className="text-caption text-ink-muted mt-4 text-center">
            Answer all questions before submitting.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
