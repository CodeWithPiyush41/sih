import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PDFUploader } from '@/components/upload/PDFUploader';

export function UploadPDFPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);

  const handleFileReady = (file: File, id?: string | null) => {
    setSelectedFile(file);
    if (id) setMaterialId(id);
  };

  const handleNext = () => {
    if (selectedFile) {
      const targetUrl = materialId
        ? `/student/config-assessment?materialId=${materialId}&fileName=${encodeURIComponent(selectedFile.name)}`
        : `/student/config-assessment?fileName=${encodeURIComponent(selectedFile.name)}`;
      navigate(targetUrl);
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Upload Statistical Training Material"
        subtitle="Upload survey manuals, sampling guides, or personal study notes (PDF) for automated concept extraction and practice question generation."
      />

      <div className="max-w-2xl mx-auto">
        <PDFUploader onFileReady={handleFileReady} onNext={handleNext} />
      </div>
    </DashboardLayout>
  );
}
