import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockTeacherAssessments, mockQuestionPerformance } from '@/lib/mock';
import { ArrowLeft, Users, FileText, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function TeacherAssessmentDetailPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const assessment = mockTeacherAssessments.find(a => a.id === assessmentId) || mockTeacherAssessments[0];

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/assessments')} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Assessments
        </Button>
      </div>

      <PageHeader
        title={assessment.title}
        subtitle="Detailed analytics and question-level performance for this assessment."
        action={
          <Badge variant={assessment.source === 'Teacher Created' ? 'primary' : 'neutral'}>
            {assessment.source}
          </Badge>
        }
      />

      {/* Assessment Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Questions</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{assessment.questionsCount}</span>
        </Card>
        
        <Card className="p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Attempts</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{assessment.attemptsCount}</span>
        </Card>
        
        <Card className="p-5 flex flex-col justify-center bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
          </div>
          <span className={`text-2xl font-bold ${assessment.averageScore < 50 ? 'text-amber-600' : 'text-primary'}`}>
            {assessment.averageScore}%
          </span>
        </Card>
        
        <Card className="p-5 flex flex-col justify-center bg-emerald-50/50 border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Completion</span>
          </div>
          <span className="text-2xl font-bold text-emerald-700">91%</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Question Performance List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Question Performance</h3>
          <p className="text-xs text-slate-500 mb-6">Percentage of students who answered each question correctly.</p>
          
          <div className="space-y-4">
            {mockQuestionPerformance.map((q, idx) => (
              <div key={q.questionId} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Q{idx + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{q.text}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${q.correctPercent > 75 ? 'bg-emerald-500' : q.correctPercent > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${q.correctPercent}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${q.correctPercent > 75 ? 'text-emerald-600' : q.correctPercent > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {q.correctPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lower Performance Topics & Chart */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" /> Topic Weaknesses
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 border border-amber-100 bg-amber-50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-900">Data Validation</span>
                <Badge variant="danger">38% Avg</Badge>
              </div>
              <div className="p-3 border border-amber-100 bg-amber-50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-900">Sampling Methods</span>
                <Badge variant="warning">52% Avg</Badge>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
             <h3 className="font-bold text-slate-900 text-base mb-4">Question Accuracy Spread</h3>
             <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={mockQuestionPerformance} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                   <XAxis type="number" domain={[0, 100]} hide />
                   <YAxis dataKey="questionId" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                   <Bar dataKey="correctPercent" radius={[0, 4, 4, 0]} barSize={16}>
                     {mockQuestionPerformance.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.correctPercent > 75 ? '#10b981' : entry.correctPercent > 50 ? '#f59e0b' : '#ef4444'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
