import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompetencyPanel } from '@/components/CompetencyPanel';
import { WeakAreaCallout } from '@/components/WeakAreaCallout';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ClipboardList } from 'lucide-react';
import {
  getCourseById,
  getAssessmentsForCourse,
  getStudentCourseSummary,
} from '@/lib/data/mockData';

export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? '');
  const assessments = getAssessmentsForCourse(courseId ?? '');
  const summary = getStudentCourseSummary('s1', courseId ?? '');

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
        <Link to="/student" className="text-body-sm text-signal hover:text-signal-hover">
          Back to courses
        </Link>
      </div>
      <h1 className="text-h1 text-ink mb-1">{course.name}</h1>
      <p className="text-body text-ink-muted mb-8">{course.description}</p>

      <div className="flex flex-col gap-6">
        <CompetencyPanel
          title="Your competency"
          overallScorePercent={summary.overallScorePercent}
          topicScores={summary.topicScores}
        />

        <WeakAreaCallout summary={summary} />

        <div>
          <h2 className="text-h2 text-ink mb-4">Available assessments</h2>
          {assessments.length === 0 ? (
            <div className="bg-surface border border-border rounded-panel p-8">
              <p className="text-body text-ink-muted">No assessments yet. Upload material to generate one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between gap-4 bg-surface border border-border rounded-panel p-5"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={20} strokeWidth={1.5} className="text-signal shrink-0" />
                    <div>
                      <p className="text-body text-ink">{assessment.title}</p>
                      <p className="text-caption text-ink-muted">
                        {assessment.questionIds.length} questions
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/student/courses/${course.id}/assessment/${assessment.id}`}
                  >
                    <Button className="text-caption py-2">Start</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
