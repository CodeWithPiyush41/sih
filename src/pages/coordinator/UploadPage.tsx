import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Upload, FileText, Check, Pencil } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/Input';
import { getCourseById, getTopicsForCourse } from '@/lib/data/mockData';

export function UploadPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? '');
  const existingTopics = getTopicsForCourse(courseId ?? '');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    
    if (!course) {
      setError('Course not found.');
      return;
    }

    setUploading(true);
    setError(null);

    // Provide a dummy subjectId since UI doesn't have subject selection yet
    const dummySubjectId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Dynamically import the service to avoid issues if other parts aren't fully migrated
    const { MaterialService } = await import('@/lib/services/material.service');

    const res = await MaterialService.uploadMaterial(file, file.name, 'teacher_material', course.id, dummySubjectId);

    if (res.error) {
      setError(res.error);
      setUploading(false);
    } else {
      setUploaded(true);
      setUploading(false);
    }
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
        Upload a PDF to SkillLens. AI processing will be enabled in a future phase.
      </p>

      {!uploaded && (
        <div className="bg-surface border border-border border-dashed rounded-panel p-12 text-center hover:border-border-strong transition-colors duration-150">
          <Upload size={24} strokeWidth={1.5} className="text-ink-muted mx-auto mb-3" />
          <p className="text-body text-ink mb-4">Select a PDF to upload</p>
          
          <input 
            type="file" 
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="mb-6 block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <Button onClick={handleUpload} isLoading={uploading} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </div>
      )}

      {uploaded && (
        <div className="bg-surface border border-border rounded-panel p-8">
          <div className="flex items-center gap-2 mb-4">
            <Check size={20} strokeWidth={1.5} className="text-strong" />
            <h2 className="text-h2 text-ink">Uploaded successfully!</h2>
          </div>
          <p className="text-body text-ink-secondary mb-6">
            The file has been uploaded and is waiting for processing.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => { setUploaded(false); setFile(null); }} variant="secondary">
              Upload another
            </Button>
            <Link to={`/teacher/courses/${course.id}`}>
              <Button>Course overview</Button>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
