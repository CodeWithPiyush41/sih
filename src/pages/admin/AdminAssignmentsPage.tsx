import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, Award, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase/client';

interface DBAssessment {
  id: string;
  title: string;
  competency_area?: string;
  assessment_type?: string;
  questions_count?: number;
  attempts_count?: number;
  status?: string;
  courses?: { name?: string } | null;
  course_name?: string;
}

export function AdminAssignmentsPage() {
  const [search, setSearch] = useState('');
  const [assessments, setAssessments] = useState<DBAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, courses(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[AdminAssignmentsPage] Error fetching assessments:', error.message);
      } else if (data) {
        setAssessments(
          data.map((item: any) => ({
            ...item,
            course_name: item.courses?.name || item.competency_area || 'Official Statistics Capability Development',
          }))
        );
      }
    } catch (err) {
      console.error('[AdminAssignmentsPage] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleAction = (action: string) => {
    toast(`${action} action triggered`, 'info');
  };

  const filteredAssessments = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.course_name && a.course_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Global Assignment Directory"
        subtitle="View and manage all assessments and question banks across the entire platform."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAssessments} disabled={loading}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => handleAction('Create Global Assessment')}>
              <Plus size={16} className="mr-1.5" /> Global Assignment
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search all assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => handleAction('Filter')}>
            <Filter size={14} className="mr-1.5" /> Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Assignment Title</th>
                <th className="p-4 font-semibold">Course / Competency</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Attempts</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading assignments from database...
                  </td>
                </tr>
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{assessment.title}</p>
                          <p className="text-xs text-slate-500">
                            {assessment.questions_count || 10} Questions
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {assessment.course_name}
                    </td>
                    <td className="p-4">
                      <Badge variant="primary">
                        {assessment.assessment_type || 'Official Assessment'}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-600">{assessment.attempts_count || 0}</td>
                    <td className="p-4">
                      <Badge variant="success" className="flex w-fit items-center gap-1">
                        <CheckCircle2 size={12} /> Active
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleAction('View Analytics')}>
                        Analytics
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No assignments found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
