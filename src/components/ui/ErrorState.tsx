import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load this section. Please try again.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 border border-red-100 rounded-xl text-center w-full">
      <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4">
        <AlertOctagon size={24} />
      </div>
      <h3 className="text-base font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-red-700 text-sm max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="bg-white border-red-200 text-red-700 hover:bg-red-50">
          Try Again
        </Button>
      )}
    </div>
  );
}
