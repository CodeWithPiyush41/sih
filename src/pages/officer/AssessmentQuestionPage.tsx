import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionRenderer } from '@/components/assessment/QuestionRenderer';
import { AssessmentSidebar } from '@/components/assessment/AssessmentSidebar';
import { ConfirmSubmitModal } from '@/components/assessment/ConfirmSubmitModal';
import { Timer } from '@/components/assessment/Timer';
import { Button } from '@/components/ui/Button';
import { mockAssessment, mockQuestions, mockTopics } from '@/lib/mock';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, Menu } from 'lucide-react';
import { Attempt, SkillScore } from '@/types';

export function AssessmentQuestionPage() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();

  const assessment = mockAssessment;
  const questions = mockQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleSelectOption = useCallback((value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion.id]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxTotalScore = 0;
    const topicScores: Record<string, number> = {};
    const topicMaxScores: Record<string, number> = {};

    questions.forEach((q) => {
      const mark = q.marks || 1;
      maxTotalScore += mark;
      topicMaxScores[q.topicId] = (topicMaxScores[q.topicId] || 0) + mark;

      let earned = 0;
      const answer = answers[q.id];

      if (q.type === 'mcq') {
        const correctOption = q.options?.find(o => o.isCorrect);
        if (correctOption && correctOption.id === answer) {
          earned = mark;
        }
      } else if (q.type === 'short_answer') {
        if (answer && answer.length > 10) {
          earned = mark; // mock scoring logic
        }
      } else if (q.type === 'coding') {
        if (answer && answer.includes('Vehicle')) {
          earned = mark; // mock scoring logic
        }
      }

      totalScore += earned;
      topicScores[q.topicId] = (topicScores[q.topicId] || 0) + earned;
    });

    return { totalScore, maxTotalScore, topicScores, topicMaxScores };
  };

  const handleSubmit = () => {
    const { totalScore, maxTotalScore, topicScores, topicMaxScores } = calculateScore();
    const attemptId = `att-${Date.now()}`;

    const attempt: Attempt = {
      id: attemptId,
      assessmentId: assessment.id,
      userId: 'u1',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      score: totalScore,
      maxScore: maxTotalScore,
      topicScores,
      topicMaxScores,
      answers,
    };

    navigate(`/student/results/${attemptId}`, { state: { attempt } });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Quiz Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {assessment.title}
              </h1>
              <p className="text-xs text-slate-500">
                SkillLens AI
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <Timer initialMinutes={assessment.timeLimitMinutes || 15} onTimeUp={handleSubmit} />
            <span className="text-xs text-slate-500 mt-1 hidden sm:block">
              Progress: {Math.round((Object.keys(answers).length / questions.length) * 100)}%
            </span>
          </div>
        </div>
      </header>

      {/* Main Runner Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 lg:gap-8">
        
        {/* Left Column: Question Area */}
        <div className="flex-1 flex flex-col space-y-6 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Question {currentIndex + 1} of {questions.length}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMarkForReview}
              className={markedForReview.has(currentQuestion.id) ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}
            >
              <Flag size={14} className={`mr-1.5 ${markedForReview.has(currentQuestion.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
              {markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
            </Button>
          </div>

          <QuestionRenderer
            question={currentQuestion}
            value={answers[currentQuestion.id] || ''}
            onChange={handleSelectOption}
          />

          {/* Action Controls */}
          <div className="flex items-center justify-between pt-4 pb-12 lg:pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Previous
            </Button>

            {currentIndex === questions.length - 1 ? (
              <Button type="button" variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
                <CheckCircle2 size={16} className="mr-1.5" />
                Submit
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleNext}>
                Next
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24">
            <AssessmentSidebar
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              markedForReview={markedForReview}
              onNavigate={setCurrentIndex}
              onSubmit={() => setIsSubmitModalOpen(true)}
            />
          </div>
        </aside>

        {/* Mobile Drawer (Sidebar) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative w-[280px] max-w-full bg-white h-full shadow-2xl flex flex-col p-4 animate-in slide-in-from-left duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">Navigation</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AssessmentSidebar
                  questions={questions}
                  currentIndex={currentIndex}
                  answers={answers}
                  markedForReview={markedForReview}
                  onNavigate={(i) => {
                    setCurrentIndex(i);
                    setIsSidebarOpen(false);
                  }}
                  onSubmit={() => {
                    setIsSidebarOpen(false);
                    setIsSubmitModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmit}
        questions={questions}
        answers={answers}
        markedForReview={markedForReview}
      />
    </div>
  );
}
