import { useState, useRef, KeyboardEvent } from 'react';
import { UploadCloud, FileType2, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  maxSizeMB?: number;
}

export function DropZone({ onFileSelected, maxSizeMB = 20 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center p-12 mt-4 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,.pdf"
          className="hidden"
          aria-label="Upload PDF file"
        />
        <div className={`p-4 rounded-full mb-4 transition-colors duration-200 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Click to upload or drag and drop
        </h3>
        <p className="text-sm text-slate-500 max-w-sm text-center">
          Only PDF files up to {maxSizeMB}MB are supported.
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Upload Error</h4>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
