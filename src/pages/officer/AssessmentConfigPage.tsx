import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AIClient } from '@/lib/api/ai.client';
import { FileText, Sliders, Clock, Sparkles, Loader2 } from 'lucide-react';

type DifficultyMode = 'normal' | 'medium' | 'hard';

export function AssessmentConfigPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileName = searchParams.get('fileName') || 'Official_Survey_Methodology_Guidelines.pdf';
  const materialId = searchParams.get('materialId') || undefined;

  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(15);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (materialId) {
        const res = await AIClient.generateAssessment({
          materialId,
          title: `Assessment: ${fileName.replace(/\.[^/.]+$/, '')}`,
          difficulty: difficulty === 'normal' ? 'easy' : difficulty,
          questionCount,
          timeLimitMinutes: timeLimit,
        });
        if (res.assessmentId) {
          navigate(`/student/assessments/${res.assessmentId}`);
          return;
        }
      }
      navigate('/student/assessments');
    } catch (err: any) {
      console.warn('Failed to generate custom assessment:', err);
      navigate('/student/assessments');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Configure Skill Assessment"
        subtitle="Customize difficulty, topic scope, and time limits for your AI-generated assessment."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Selected Document Summary Card */}
        <Card className="flex items-center justify-between gap-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{fileName}</h4>
              <p className="text-xs text-slate-500">Status: Ready for topic mapping</p>
            </div>
          </div>
          <Badge variant="success">Material Ready</Badge>
        </Card>

        {/* Difficulty Selection Mode */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={18} className="text-primary" />
            <h3 className="font-bold text-slate-900 text-base">Select Assessment Difficulty</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Easy */}
            <div
              onClick={() => setDifficulty('normal')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                difficulty === 'normal'
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">Easy — Direct Recall & Definitions</span>
                <Badge variant="primary">Concept Recall</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tests fundamental concepts, terminology, definitions, and basic understanding.
              </p>
            </div>

            {/* Medium */}
            <div
              onClick={() => setDifficulty('medium')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                difficulty === 'medium'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">Medium — Applied Scenario Questions</span>
                <Badge variant="warning">Scenario MCQ</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tests the ability to apply concepts to practical statistical and workplace scenarios.
              </p>
            </div>

            {/* Hard */}
            <div
              onClick={() => setDifficulty('hard')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                difficulty === 'hard'
                  ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">Hard — Case Study & Analytical Reasoning</span>
                <Badge variant="danger">Case Study</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tests deeper interpretation, analytical reasoning, decision-making, and case-based problem solving.
              </p>
            </div>
          </div>
        </Card>

        {/* Question Count & Time Limit Controls */}
        <Card className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Number of Questions
            </label>
            <div className="flex items-center gap-2">
              <select
                value={questionCount === 10 || questionCount === 15 || questionCount === 20 ? questionCount : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') setQuestionCount(25);
                  else setQuestionCount(Number(val));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
              >
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
                <option value="custom">Custom...</option>
              </select>
              {![10, 15, 20].includes(questionCount) && (
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Time Limit (Minutes)
            </label>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button variant="primary" size="lg" onClick={handleGenerate} disabled={generating} className="shadow-md">
            {generating ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Generating Assessment...
              </>
            ) : (
              <>
                <Sparkles size={18} className="mr-2" />
                Generate Assessment
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
