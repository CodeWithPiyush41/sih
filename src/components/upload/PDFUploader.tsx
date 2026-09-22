import { useState } from 'react';
import { DropZone } from './DropZone';
import { UploadProgress } from './UploadProgress';
import { FilePreview } from './FilePreview';
import { MaterialService } from '@/lib/services/material.service';
import { useAuth } from '@/lib/auth/AuthContext';

interface PDFUploaderProps {
  onFileReady: (file: File, materialId?: string | null) => void;
  onNext?: () => void;
  maxSizeMB?: number;
  materialType?: 'teacher_material' | 'personal_material';
  courseId?: string;
}

export function PDFUploader({
  onFileReady,
  onNext,
  maxSizeMB = 20,
  materialType = 'personal_material',
  courseId,
}: PDFUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setUploading(true);
    setUploadProgress(20);
    setError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);

    const res = await MaterialService.uploadMaterial(
      selectedFile,
      selectedFile.name,
      materialType,
      courseId,
      undefined,
      user?.id
    );

    clearInterval(progressInterval);

    if (res.error) {
      setError(res.error);
      setUploading(false);
      setUploadProgress(0);
    } else {
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setFile(selectedFile);
        onFileReady(selectedFile, res.materialId);
      }, 400);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadProgress(0);
    setError(null);
  };

  if (uploading) {
    return <UploadProgress progress={uploadProgress} fileName={file?.name || 'Processing & Extracting PDF...'} />;
  }

  if (file) {
    return (
      <FilePreview
        file={file}
        onReplace={handleRemove}
        onRemove={handleRemove}
        onNext={onNext}
      />
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}
      <DropZone onFileSelected={handleFileSelected} maxSizeMB={maxSizeMB} />
    </div>
  );
}
