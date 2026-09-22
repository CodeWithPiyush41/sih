import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { mockStudentProgressHistory, mockAssessments } from '@/lib/mock/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function ProgressPage() {
  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Learning Progress & Mastery Timeline"
        subtitle="Track your overall skill growth and historical assessment performance over time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Overall Skill Score Trend</h3>
              <p className="text-xs text-slate-500">Mastery progression across completed assessments</p>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <TrendingUp size={12} />
              +13% Growth
            </Badge>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockStudentProgressHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Overall Score']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#1EA97B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#1EA97B', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Mastery Milestone Summary</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              You have completed <span className="font-semibold text-slate-900">4 assessments</span> this month with an average score of <span className="font-semibold text-primary">68%</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Highest Topic Score:</span>
              <span className="font-semibold text-slate-900">Survey Methodology (78%)</span>
            </div>
            <div className="flex justify-between">
              <span>Current Gap Topic:</span>
              <span className="font-semibold text-red-600">Data Validation (38%)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* History Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 text-sm">Assessment History Log</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {mockAssessments.map((a) => (
            <div key={a.id} className="p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{a.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                    <span>• {a.durationMinutes} mins</span>
                  </div>
                </div>
              </div>

              <Badge variant="warning">Score: 38%</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
