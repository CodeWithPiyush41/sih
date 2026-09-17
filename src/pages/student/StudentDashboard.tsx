import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CourseCard } from '@/components/CourseCard';
import { getEnrolledCoursesForStudent, getStudentCourseSummary } from '@/lib/data/mockData';

export function StudentDashboard() {
  const courses = getEnrolledCoursesForStudent('s1');

  return (
    <DashboardLayout role="student">
      <div className="mb-8">
        <h1 className="text-h1 text-ink mb-1">Your courses</h1>
        <p className="text-body text-ink-muted">
          Track your competency across enrolled courses.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface border border-border rounded-panel p-12 text-center">
          <p className="text-body text-ink-muted">
            No courses yet. Ask your teacher to enroll you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const summary = getStudentCourseSummary('s1', course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                overallScorePercent={summary.overallScorePercent}
                to={`/student/courses/${course.id}`}
              />
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
