import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/Button';
import { getCoursesForTeacher, getStudentCountForCourse, getClassWideTopicScores } from '@/lib/data/mockData';

export function TeacherDashboard() {
  const courses = getCoursesForTeacher('t1');

  return (
    <DashboardLayout role="teacher">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 text-ink mb-1">Courses</h1>
          <p className="text-body text-ink-muted">
            Manage your courses, upload material, and review questions.
          </p>
        </div>
        <Link to="/teacher/courses/new">
          <Button>
            <span className="flex items-center gap-2">
              <Plus size={16} strokeWidth={1.5} />
              New course
            </span>
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface border border-border rounded-panel p-12 text-center">
          <p className="text-body text-ink-muted">No courses yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const studentCount = getStudentCountForCourse(course.id);
            const classScores = getClassWideTopicScores(course.id);
            const avg = classScores.length > 0
              ? Math.round(classScores.reduce((s, t) => s + t.scorePercent, 0) / classScores.length)
              : 0;
            return (
              <CourseCard
                key={course.id}
                course={course}
                studentCount={studentCount}
                overallScorePercent={avg}
                to={`/teacher/courses/${course.id}`}
              />
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
