import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SkillScore } from '@/types';

interface SkillChartProps {
  scores?: SkillScore[];
}

export function SkillChart({ scores }: SkillChartProps) {
  const safeScores = Array.isArray(scores) ? scores : [];

  if (safeScores.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 p-6">
        <p className="text-sm font-semibold text-slate-600">No competency data available yet.</p>
        <p className="text-xs text-slate-400 mt-1">Complete an assessment to populate your competency matrix.</p>
      </div>
    );
  }

  const data = safeScores.map((s) => ({
    name: s?.topicName || (s as any)?.topic_name || (s as any)?.name || 'Competency',
    score: s?.score ?? (s as any)?.scorePercent ?? (s as any)?.score_percent ?? 0,
  }));

  const getBarColor = (score: number) => {
    if (score >= 75) return '#16A34A'; // Success green
    if (score >= 50) return '#F59E0B'; // Warning amber
    return '#DC2626'; // Danger red
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            formatter={(val: any) => [`${val}%`, 'Mastery Score']}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
