import { FileText, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilePreviewProps {
  file: File;
  onReplace: () => void;
  onRemove: () => void;
  onNext?: () => void;
}

export function FilePreview({ file, onReplace, onRemove, onNext }: FilePreviewProps) {
  // Format file size
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <FileText size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500">{sizeInMB} MB</p>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-sm font-medium text-success flex items-center gap-1">
                  <CheckCircle2 size={14} /> Ready for processing
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove file"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <Button variant="outline" onClick={onReplace}>
            Replace File
          </Button>
          {onNext && (
            <Button onClick={onNext} className="gap-2">
              Continue to Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
