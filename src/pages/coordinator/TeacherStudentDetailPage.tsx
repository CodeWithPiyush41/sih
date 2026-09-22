import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkillChart } from '@/components/skills/SkillChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { mockStudentsList, mockSkillScores, mockStudentProgress } from '@/lib/mock';
import { ArrowLeft, User, Mail, Award, CheckCircle2, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TeacherStudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const student = mockStudentsList.find(s => s.id === studentId);

  if (!student) {
    return (
      <DashboardLayout role="teacher">
        <PageHeader title="Student Not Found" />
        <EmptyState
          icon={<User size={48} />}
          title="Unknown Student"
          description="The student profile you are looking for does not exist or you don't have permission to view it."
          actionLabel="Back to Roster"
          onAction={() => navigate('/teacher/students')}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/students')} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Roster
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <Card className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mb-4 shadow-sm border border-primary/20">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{student.name}</h2>
          <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5 mb-6">
            <Mail size={14} /> {student.email}
          </p>
          
          <div className="w-full flex gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Status</span>
              <Badge variant={student.status === 'On Track' ? 'success' : student.status === 'At Risk' ? 'danger' : 'warning'}>
                {student.status}
              </Badge>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Assessments</span>
              <span className="font-bold text-slate-900">{student.assessments}</span>
            </div>
          </div>
        </Card>

        {/* Overall Score & Weak Area */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col justify-center p-6 bg-gradient-to-br from-primary/10 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary text-white shadow-sm">
                <Award size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Overall Skill Score</h3>
            </div>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-extrabold ${student.overallSkill < 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                {student.overallSkill}%
              </span>
              <span className="text-sm font-medium text-emerald-600 flex items-center mb-1">
                <TrendingUp size={16} className="mr-1" /> +4% this week
              </span>
            </div>
          </Card>

          <Card className="flex flex-col justify-center p-6 border-amber-200 bg-amber-50/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Primary Weakness</h3>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-800 mb-1">Data Validation</p>
              <p className="text-sm text-amber-700">Consistently scoring &lt;40% in this topic across multiple assessments.</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progression Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Learning Progression</h3>
          <p className="text-xs text-slate-500 mb-6">Historical performance across all completed assessments</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockStudentProgress.recentActivity.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1EA97B"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1EA97B', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#1EA97B', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Attempts List */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">Assessment History</h3>
          <div className="space-y-4">
            {mockStudentProgress.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-0.5">{activity.title}</p>
                  <p className="text-[11px] text-slate-500">{activity.date}</p>
                </div>
                <div className={`font-bold text-sm ${activity.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activity.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Performance Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-1">Detailed Topic Performance</h3>
        <p className="text-xs text-slate-500 mb-6">Current mastery levels for individual concepts</p>
        <SkillChart scores={mockSkillScores} />
      </div>

    </DashboardLayout>
  );
}
