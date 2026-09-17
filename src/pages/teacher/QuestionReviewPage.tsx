import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { QuestionReviewCard } from '@/components/QuestionReviewCard';
import { Button } from '@/components/Button';
import { Select } from '@/components/Input';
import { Badge } from '@/components/Badge';
import {
  getCourseById,
  getTopicsForCourse,
  getQuestionsForCourse,
} from '@/lib/data/mockData';
import type { Question } from '@/lib/types';
import { Check } from 'lucide-react';

type StatusFilter = 'all' | 'pending_review' | 'approved' | 'rejected';

export function QuestionReviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? '');
  const topics = getTopicsForCourse(courseId ?? '');
  const initialQuestions = getQuestionsForCourse(courseId ?? '');

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Question | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (topicFilter !== 'all' && q.topicId !== topicFilter) return false;
      return true;
    });
  }, [questions, statusFilter, topicFilter]);

  const groupedByTopic = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of filtered) {
      const arr = map.get(q.topicId) ?? [];
      arr.push(q);
      map.set(q.topicId, arr);
    }
    return map;
  }, [filtered]);

  const updateQuestionStatus = (questionId: string, status: Question['status']) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, status } : q))
    );
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditState({ ...q, options: q.options.map((o) => ({ ...o })) });
  };

  const saveEdit = () => {
    if (!editState) return;
    setQuestions((prev) =>
      prev.map((q) => (q.id === editState.id ? editState : q))
    );
    setEditingId(null);
    setEditState(null);
  };

  const bulkApprove = (topicId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.topicId === topicId && q.status === 'pending_review'
          ? { ...q, status: 'approved' }
          : q
      )
    );
  };

  if (!course) {
    return (
      <DashboardLayout role="teacher">
        <p className="text-body text-ink-muted">Course not found.</p>
      </DashboardLayout>
    );
  }

  const topicName = (topicId: string) =>
    topics.find((t) => t.id === topicId)?.name ?? 'Unknown topic';

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6">
        <Link
          to={`/teacher/courses/${course.id}`}
          className="text-body-sm text-signal hover:text-signal-hover"
        >
          Back to {course.name}
        </Link>
      </div>
      <h1 className="text-h1 text-ink mb-1">Review questions</h1>
      <p className="text-body text-ink-muted mb-6">
        AI-generated questions for {course.name}. Approve, edit, or reject each one.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <div className="w-48">
          <Select
            label="Topic"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-panel p-12 text-center">
          <p className="text-body text-ink-muted">No questions match these filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(groupedByTopic.entries()).map(([topicId, topicQuestions]) => {
            const pendingInTopic = topicQuestions.filter(
              (q) => q.status === 'pending_review'
            ).length;
            return (
              <div key={topicId}>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-h2 text-ink">{topicName(topicId)}</h2>
                    <Badge variant="neutral">
                      {topicQuestions.length} {topicQuestions.length === 1 ? 'question' : 'questions'}
                    </Badge>
                    {pendingInTopic > 0 && (
                      <Badge variant="pending">{pendingInTopic} pending</Badge>
                    )}
                  </div>
                  {pendingInTopic > 0 && (
                    <Button
                      variant="secondary"
                      className="text-caption py-2"
                      onClick={() => bulkApprove(topicId)}
                    >
                      <span className="flex items-center gap-1.5">
                        <Check size={14} strokeWidth={1.5} />
                        Approve all pending
                      </span>
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {topicQuestions.map((q) => {
                    if (editingId === q.id && editState) {
                      return (
                        <QuestionReviewCard
                          key={q.id}
                          prompt={editState.prompt}
                          options={editState.options}
                          correctOptionId={editState.correctOptionId}
                          difficulty={editState.difficulty}
                          status={editState.status}
                          topicName={topicName(q.topicId)}
                          editable
                          onPromptChange={(val) =>
                            setEditState({ ...editState, prompt: val })
                          }
                          onOptionChange={(optId, text) =>
                            setEditState({
                              ...editState,
                              options: editState.options.map((o) =>
                                o.id === optId ? { ...o, text } : o
                              ),
                            })
                          }
                          onCorrectChange={(optId) =>
                            setEditState({ ...editState, correctOptionId: optId })
                          }
                          onEdit={saveEdit}
                        />
                      );
                    }
                    return (
                      <QuestionReviewCard
                        key={q.id}
                        prompt={q.prompt}
                        options={q.options}
                        correctOptionId={q.correctOptionId}
                        difficulty={q.difficulty}
                        status={q.status}
                        topicName={topicName(q.topicId)}
                        onApprove={() => updateQuestionStatus(q.id, 'approved')}
                        onReject={() => updateQuestionStatus(q.id, 'rejected')}
                        onEdit={() => startEdit(q)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
