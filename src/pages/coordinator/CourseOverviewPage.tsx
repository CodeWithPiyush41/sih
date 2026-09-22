import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompetencyPanel } from '@/components/CompetencyPanel';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  getCourseById,
  getTopicsForCourse,
  getQuestionsForCourse,
  getClassWideTopicScores,
  getStudentCountForCourse,
} from '@/lib/data/mockData';
import { Upload, FileQuestion, BarChart3 } from 'lucide-react';

export function CourseOverviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? '');
  const topics = getTopicsForCourse(courseId ?? '');
  const questions = getQuestionsForCourse(courseId ?? '');
  const classScores = getClassWideTopicScores(courseId ?? '');
  const studentCount = getStudentCountForCourse(courseId ?? '');

  const pendingCount = useMemo(
    () => questions.filter((q) => q.status === 'pending_review').length,
    [questions]
  );
  const approvedCount = useMemo(
    () => questions.filter((q) => q.status === 'approved').length,
    [questions]
  );

  if (!course) {
    return (
      <DashboardLayout role="teacher">
        <p className="text-body text-ink-muted">Course not found.</p>
      </DashboardLayout>
    );
  }

  const avgScore = classScores.length > 0
    ? Math.round(classScores.reduce((s, t) => s + t.scorePercent, 0) / classScores.length)
    : 0;

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6">
        <Link to="/teacher" className="text-body-sm text-signal hover:text-signal-hover">
          Back to courses
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 text-ink mb-1">{course.name}</h1>
          <p className="text-body text-ink-muted max-w-[42rem]">{course.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-panel p-4">
          <p className="text-caption text-ink-muted mb-1">Topics</p>
          <p className="text-data-lg text-ink font-mono">{topics.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-panel p-4">
          <p className="text-caption text-ink-muted mb-1">Questions</p>
          <p className="text-data-lg text-ink font-mono">{questions.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-panel p-4">
          <p className="text-caption text-ink-muted mb-1">Students</p>
          <p className="text-data-lg text-ink font-mono">{studentCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-panel p-4">
          <p className="text-caption text-ink-muted mb-1">Avg competency</p>
          <p className="text-data-lg text-ink font-mono">{avgScore}%</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link to={`/teacher/courses/${course.id}/upload`}>
          <Button variant="secondary">
            <span className="flex items-center gap-2">
              <Upload size={16} strokeWidth={1.5} />
              Upload material
            </span>
          </Button>
        </Link>
        <Link to={`/teacher/courses/${course.id}/questions`}>
          <Button variant="secondary">
            <span className="flex items-center gap-2">
              <FileQuestion size={16} strokeWidth={1.5} />
              Review questions
            </span>
          </Button>
          {pendingCount > 0 && (
            <span className="ml-2">
              <Badge variant="pending">{pendingCount} pending</Badge>
            </span>
          )}
        </Link>
        <Link to={`/teacher/analytics`}>
          <Button variant="secondary">
            <span className="flex items-center gap-2">
              <BarChart3 size={16} strokeWidth={1.5} />
              Analytics
            </span>
          </Button>
        </Link>
      </div>

      {/* Class-wide competency */}
      <div className="mb-8">
        <h2 className="text-h2 text-ink mb-4">Class-wide competency</h2>
        <CompetencyPanel
          title={`${course.name} — all students`}
          overallScorePercent={avgScore}
          topicScores={classScores}
        />
      </div>

      {/* Question status summary */}
      <div>
        <h2 className="text-h2 text-ink mb-4">Question status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-panel p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="pending">Pending</Badge>
            </div>
            <p className="text-data-lg text-ink font-mono">{pendingCount}</p>
          </div>
          <div className="bg-surface border border-border rounded-panel p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="strong">Approved</Badge>
            </div>
            <p className="text-data-lg text-ink font-mono">{approvedCount}</p>
          </div>
          <div className="bg-surface border border-border rounded-panel p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="danger">Rejected</Badge>
            </div>
            <p className="text-data-lg text-ink font-mono">
              {questions.filter((q) => q.status === 'rejected').length}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
