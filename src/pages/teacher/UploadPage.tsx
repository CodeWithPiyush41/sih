import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Upload, FileText, Check, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { getCourseById, getTopicsForCourse } from '@/lib/data/mockData';

export function UploadPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? '');
  const existingTopics = getTopicsForCourse(courseId ?? '');

  const [uploaded, setUploaded] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedTopics, setExtractedTopics] = useState<
    { name: string; included: boolean; original: string }[]
  >([]);
  const [confirmed, setConfirmed] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    setExtracting(true);
    // Mock AI extraction after a brief delay
    setTimeout(() => {
      const mockExtracted = [
        ...existingTopics.map((t) => ({ name: t.name, included: true, original: t.name })),
        { name: 'Generics & wildcards', included: true, original: 'Generics & wildcards' },
        { name: 'Lambda expressions', included: true, original: 'Lambda expressions' },
      ];
      setExtractedTopics(mockExtracted);
      setExtracting(false);
    }, 1200);
  };

  const toggleIncluded = (index: number) => {
    setExtractedTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, included: !t.included } : t))
    );
  };

  const updateName = (index: number, name: string) => {
    setExtractedTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, name } : t))
    );
  };

  const handleConfirm = () => {
    setConfirmed(true);
  };

  if (!course) {
    return (
      <DashboardLayout role="teacher">
        <p className="text-body text-ink-muted">Course not found.</p>
      </DashboardLayout>
    );
  }

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
      <h1 className="text-h1 text-ink mb-1">Upload material</h1>
      <p className="text-body text-ink-muted mb-8">
        Upload a PDF and SkillLens will extract topics from it. You can edit or remove any topic before confirming.
      </p>

      {!uploaded && (
        <div
          className="bg-surface border border-border border-dashed rounded-panel p-12 text-center cursor-pointer hover:border-border-strong transition-colors duration-150"
          onClick={handleUpload}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleUpload();
          }}
        >
          <Upload size={24} strokeWidth={1.5} className="text-ink-muted mx-auto mb-3" />
          <p className="text-body text-ink mb-1">Drop a PDF here or click to upload</p>
          <p className="text-body-sm text-ink-muted">
            The file will be analyzed to extract topics.
          </p>
        </div>
      )}

      {uploaded && extracting && (
        <div className="bg-surface border border-border rounded-panel p-12 text-center">
          <FileText size={24} strokeWidth={1.5} className="text-signal mx-auto mb-3" />
          <p className="text-body text-ink-secondary">Extracting topics from your document...</p>
        </div>
      )}

      {uploaded && !extracting && !confirmed && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-h2 text-ink">Extracted topics</span>
            <span className="text-body-sm text-ink-muted">
              AI extracted these — edit or remove any before confirming
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {extractedTopics.map((topic, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 bg-surface border rounded-panel p-4 ${
                  topic.included ? 'border-border' : 'border-border opacity-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={topic.included}
                  onChange={() => toggleIncluded(i)}
                  className="accent-signal shrink-0"
                  aria-label={`Include topic ${topic.original}`}
                />
                <Input
                  value={topic.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="flex-1"
                />
                {topic.name !== topic.original && (
                  <span className="text-caption text-ink-muted flex items-center gap-1 shrink-0">
                    <Pencil size={12} strokeWidth={1.5} />
                    Edited
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button onClick={handleConfirm}>
              <span className="flex items-center gap-2">
                <Check size={16} strokeWidth={1.5} />
                Confirm topics
              </span>
            </Button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="bg-surface border border-border rounded-panel p-8">
          <div className="flex items-center gap-2 mb-4">
            <Check size={20} strokeWidth={1.5} className="text-strong" />
            <h2 className="text-h2 text-ink">Topics confirmed</h2>
          </div>
          <p className="text-body text-ink-secondary mb-6">
            {extractedTopics.filter((t) => t.included).length} topics ready for question generation.
          </p>
          <div className="flex items-center gap-3">
            <Link to={`/teacher/courses/${course.id}/questions`}>
              <Button>Review questions</Button>
            </Link>
            <Link to={`/teacher/courses/${course.id}`}>
              <Button variant="secondary">Course overview</Button>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
