import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CompetencyPanel } from '@/components/CompetencyPanel';
import { Badge } from '@/components/Badge';
import { Select } from '@/components/Input';
import {
  getCoursesForTeacher,
  getTopicsForCourse,
  getClassWideTopicScores,
  getStudentIdsForCourse,
  getStudentName,
  getTopicScoresForStudent,
} from '@/lib/data/mockData';
import type { TopicScore } from '@/lib/types';

type SortKey = 'name' | 'weakest' | 'overall';

export function AnalyticsPage() {
  const courses = getCoursesForTeacher('t1');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? '');
  const [sortKey, setSortKey] = useState<SortKey>('weakest');

  const course = courses.find((c) => c.id === selectedCourseId);
  const classScores = getClassWideTopicScores(selectedCourseId);
  const classAvg = classScores.length > 0
    ? Math.round(classScores.reduce((s, t) => s + t.scorePercent, 0) / classScores.length)
    : 0;

  const studentIds = getStudentIdsForCourse(selectedCourseId);
  const topics = getTopicsForCourse(selectedCourseId);

  const studentRows = useMemo(() => {
    const rows = studentIds.map((sid) => {
      const name = getStudentName(sid);
      const scores = getTopicScoresForStudent(sid, selectedCourseId);
      const overall = scores.length > 0
        ? Math.round(scores.reduce((s, t) => s + t.scorePercent, 0) / scores.length)
        : 0;
      const weakest = scores.length > 0
        ? scores.reduce((min, t) => (t.scorePercent < min.scorePercent ? t : min), scores[0])
        : null;

      return { studentId: sid, name, scores, overall, weakest };
    });

    rows.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'overall') return a.overall - b.overall;
      // weakest: lowest score first
      const aScore = a.weakest?.scorePercent ?? 100;
      const bScore = b.weakest?.scorePercent ?? 100;
      return aScore - bScore;
    });

    return rows;
  }, [studentIds, selectedCourseId, sortKey]);

  return (
    <DashboardLayout role="teacher">
      <h1 className="text-h1 text-ink mb-1">Analytics</h1>
      <p className="text-body text-ink-muted mb-6">
        Class-wide competency breakdown and per-student scores.
      </p>

      {/* Course selector */}
      <div className="w-64 mb-8">
        <Select
          label="Course"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {course && (
        <>
          {/* Class-wide competency */}
          <div className="mb-8">
            <h2 className="text-h2 text-ink mb-4">Class-wide competency</h2>
            <CompetencyPanel
              title={`${course.name} — all students`}
              overallScorePercent={classAvg}
              topicScores={classScores}
            />
          </div>

          {/* Per-student table */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-h2 text-ink">Student scores</h2>
              <div className="w-48">
                <Select
                  label="Sort by"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                >
                  <option value="weakest">Weakest topic (low to high)</option>
                  <option value="overall">Overall score (low to high)</option>
                  <option value="name">Name (A to Z)</option>
                </Select>
              </div>
            </div>

            {studentRows.length === 0 ? (
              <div className="bg-surface border border-border rounded-panel p-8">
                <p className="text-body text-ink-muted">No students enrolled in this course.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-panel overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong bg-bg">
                      <th className="text-caption text-ink-secondary text-left px-4 py-3 font-medium">
                        Student
                      </th>
                      <th className="text-caption text-ink-secondary text-left px-4 py-3 font-medium">
                        Overall
                      </th>
                      <th className="text-caption text-ink-secondary text-left px-4 py-3 font-medium">
                        Weakest topic
                      </th>
                      {topics.map((t) => (
                        <th
                          key={t.id}
                          className="text-caption text-ink-secondary text-left px-4 py-3 font-medium whitespace-nowrap"
                        >
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((row) => (
                      <tr
                        key={row.studentId}
                        className="border-b border-border last:border-0 hover:bg-bg transition-colors duration-100"
                      >
                        <td className="px-4 py-3 text-body text-ink whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-data-inline text-ink font-mono">
                            {row.overall}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.weakest ? (
                            <div className="flex items-center gap-2">
                              <span className="text-body-sm text-ink-secondary">
                                {row.weakest.topicName}
                              </span>
                              <span className="text-data-inline font-mono text-ink-muted">
                                {row.weakest.scorePercent}%
                              </span>
                              {row.weakest.scorePercent < 40 ? (
                                <Badge variant="gap">Needs review</Badge>
                              ) : row.weakest.scorePercent < 75 ? (
                                <Badge variant="neutral">Developing</Badge>
                              ) : (
                                <Badge variant="strong">Strong</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-body-sm text-ink-muted">No data</span>
                          )}
                        </td>
                        {topics.map((t) => {
                          const score = row.scores.find((s) => s.topicId === t.id);
                          return (
                            <td key={t.id} className="px-4 py-3">
                              {score ? (
                                <span
                                  className={`text-data-inline font-mono ${
                                    score.scorePercent >= 75
                                      ? 'text-strong'
                                      : score.scorePercent < 40
                                      ? 'text-gap'
                                      : 'text-ink-secondary'
                                  }`}
                                >
                                  {score.scorePercent}%
                                </span>
                              ) : (
                                <span className="text-body-sm text-ink-muted">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
