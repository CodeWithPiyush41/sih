import { useParams, Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompetencyPanel } from '@/components/CompetencyPanel';
import { WeakAreaCallout } from '@/components/WeakAreaCallout';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  getCourseById,
  getQuestionsByIds,
  getTopicsForCourse,
  getAttemptById,
  computeAttemptScores,
} from '@/lib/data/mockData';
import { computeRecommendedReviewOrder } from '@/lib/recommend';
import type { TopicScore, StudentCourseSummary } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

interface AssessmentState {
  assessmentId: string;
  answers: { [questionId: string]: string };
  questionIds: string[];
}

export function ResultsPage() {
  const { courseId, attemptId } = useParams<{ courseId: string; attemptId: string }>();
  const location = useLocation();
  const course = getCourseById(courseId ?? '');

  const state = location.state as AssessmentState | null;

  // Try to load from existing mock attempt if no state passed
  const existingAttempt = getAttemptById(attemptId ?? '');

  const topicScores: TopicScore[] = useMemo(() => {
    if (state) {
      const questions = getQuestionsByIds(state.questionIds);
      const topics = getTopicsForCourse(courseId ?? '');
      const byTopic = new Map<string, { answered: number; correct: number }>();

      for (const q of questions) {
        const selected = state.answers[q.id];
        const isCorrect = selected === q.correctOptionId;
        const entry = byTopic.get(q.topicId) ?? { answered: 0, correct: 0 };
        entry.answered += 1;
        if (isCorrect) entry.correct += 1;
        byTopic.set(q.topicId, entry);
      }

      return topics
        .map((topic) => {
          const entry = byTopic.get(topic.id) ?? { answered: 0, correct: 0 };
          return {
            topicId: topic.id,
            topicName: topic.name,
            scorePercent: entry.answered > 0 ? Math.round((entry.correct / entry.answered) * 100) : 0,
            questionsAnswered: entry.answered,
            questionsCorrect: entry.correct,
          };
        })
        .filter((ts) => ts.questionsAnswered > 0);
    }
    if (existingAttempt) {
      return computeAttemptScores(existingAttempt);
    }
    return [];
  }, [state, existingAttempt, courseId]);

  const overallScore = topicScores.length > 0
    ? Math.round(topicScores.reduce((s, t) => s + t.scorePercent, 0) / topicScores.length)
    : 0;

  const weakest = topicScores.length > 0
    ? topicScores.reduce((min, t) => (t.scorePercent < min.scorePercent ? t : min), topicScores[0])
    : null;

  const topics = getTopicsForCourse(courseId ?? '');
  const recommendedOrder = computeRecommendedReviewOrder(topicScores, topics);

  const summary: StudentCourseSummary = {
    courseId: courseId ?? '',
    courseName: course?.name ?? '',
    overallScorePercent: overallScore,
    topicScores,
    weakestTopic: weakest,
    recommendedReviewOrder: recommendedOrder,
  };

  // Check for previous attempt for comparison
  const previousAttempts = existingAttempt ? [] : [];
  const hasComparison = previousAttempts.length > 0;

  if (!course) {
    return (
      <DashboardLayout role="student">
        <p className="text-body text-ink-muted">Course not found.</p>
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

      <h1 className="text-h1 text-ink mb-1">Results</h1>
      <p className="text-body text-ink-muted mb-8">
        {existingAttempt
          ? `Attempt from ${new Date(existingAttempt.submittedAt).toLocaleDateString()}`
          : 'Your assessment has been submitted.'}
      </p>

      {/* Overall score */}
      <div className="bg-surface border border-border rounded-panel p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-caption text-ink-muted mb-1">Overall score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-data-lg text-ink font-mono">{overallScore}</span>
              <span className="text-body-sm text-ink-muted">%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {overallScore >= 75 ? (
              <Badge variant="strong">Strong</Badge>
            ) : overallScore < 40 ? (
              <Badge variant="gap">Needs review</Badge>
            ) : (
              <Badge variant="neutral">Developing</Badge>
            )}
            <span className="text-caption text-ink-muted">
              {topicScores.reduce((s, t) => s + t.questionsCorrect, 0)} of{' '}
              {topicScores.reduce((s, t) => s + t.questionsAnswered, 0)} correct
            </span>
          </div>
        </div>
      </div>

      {/* Per-topic breakdown */}
      <div className="mb-6">
        <CompetencyPanel
          title="Per-topic breakdown"
          overallScorePercent={overallScore}
          topicScores={topicScores}
        />
      </div>

      {/* Weak area callout */}
      <div className="mb-6">
        <WeakAreaCallout summary={summary} />
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Link to={`/student/courses/${course.id}`}>
          <Button>
            <span className="flex items-center gap-2">
              <RotateCcw size={16} strokeWidth={1.5} />
              Retake recommended topics
            </span>
          </Button>
        </Link>
        <Link to="/student">
          <Button variant="secondary">Back to courses</Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
