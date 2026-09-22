import { FileText, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export function UploadProgress({ progress, fileName }: UploadProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="text-primary" size={28} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">Uploading PDF</h3>
        <p className="text-sm text-slate-500 max-w-sm truncate mb-8">{fileName}</p>

        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span className="text-slate-700">Uploading...</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
