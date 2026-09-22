import { useNavigate } from 'react-router-dom';
import { CodeEditor } from '@/components/assessment/CodeEditor';
import { Timer } from '@/components/assessment/Timer';
import { mockQuestions } from '@/lib/mock';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CodingAssessmentPage() {
  const navigate = useNavigate();
  const codingQuestion =
    mockQuestions.find((q) => q.type === 'coding') || mockQuestions[1];

  const handleSubmit = () => {
    navigate('/student/results/att-101');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Coding Header */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/assessments')}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            Exit
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold text-white">Statistical Data Processing Script Challenge (Python)</h1>
        </div>

        <Timer initialMinutes={20} onTimeUp={handleSubmit} />
      </header>

      {/* Split Body */}
      <main className="flex-1 p-4 sm:p-6 overflow-hidden">
        <CodeEditor question={codingQuestion} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
