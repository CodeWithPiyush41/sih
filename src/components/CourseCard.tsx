import { Link } from 'react-router-dom';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
  studentCount?: number;
  overallScorePercent?: number;
  to: string;
  footer?: React.ReactNode;
}

export function CourseCard({
  course,
  studentCount,
  overallScorePercent,
  to,
  footer,
}: CourseCardProps) {
  return (
    <Link
      to={to}
      className="block bg-surface border border-border rounded-panel p-6 transition-colors duration-150 hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="text-h3 text-ink">{course.name}</h3>
        {overallScorePercent !== undefined && (
          <span className="text-data-lg text-ink font-mono shrink-0">
            {overallScorePercent}%
          </span>
        )}
      </div>
      <p className="text-body-sm text-ink-muted mb-4 line-clamp-2">
        {course.description}
      </p>
      <div className="flex items-center justify-between">
        {studentCount !== undefined ? (
          <span className="text-caption text-ink-muted">
            {studentCount} {studentCount === 1 ? 'student' : 'students'}
          </span>
        ) : (
          <span />
        )}
        {footer}
      </div>
    </Link>
  );
}
