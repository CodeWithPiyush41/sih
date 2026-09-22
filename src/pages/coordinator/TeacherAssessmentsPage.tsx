import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockTeacherAssessments } from '@/lib/mock';
import { Plus } from 'lucide-react';

export function TeacherAssessmentsPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Coordinator Assessments"
        subtitle="Review, publish, and evaluate official statistical competency assessments for officers."
        action={
          <Button variant="primary" onClick={() => navigate('/teacher/materials')}>
            <Plus size={16} className="mr-1.5" />
            Create New Assessment
          </Button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Assessment Title</th>
                <th className="p-4 font-semibold">Type / Source</th>
                <th className="p-4 font-semibold">Questions</th>
                <th className="p-4 font-semibold">Officers Tested</th>
                <th className="p-4 font-semibold">Avg. Competency</th>
                <th className="p-4 font-semibold">Created Date</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {mockTeacherAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900 mb-0.5">{assessment.title}</p>
                    <Badge variant={String(assessment.difficulty).toLowerCase() === 'hard' ? 'danger' : 'warning'}>
                      {assessment.difficulty}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="primary">
                      {assessment.source}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{assessment.questionsCount}</td>
                  <td className="p-4 text-slate-600 font-medium">{assessment.attemptsCount}</td>
                  <td className="p-4">
                    <span className={`font-semibold ${assessment.averageScore < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {assessment.averageScore}%
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{assessment.date}</td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}>
                      Analytics
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
