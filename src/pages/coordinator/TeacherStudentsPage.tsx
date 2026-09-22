import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Building2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface OfficerRecord {
  id: string;
  name: string;
  email: string;
  designation: string;
  departmentMdo: string;
  assessmentsCount: number;
  overallCompetency: number | null;
  priorityGap: string;
  status: 'Proficient' | 'Developing' | 'Needs Attention' | 'Not Evaluated';
}

export function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const { data: profileRows, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.student,role.eq.officer,role.is.null')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[TeacherStudentsPage] Error fetching profiles:', error.message);
      } else if (profileRows) {
        const records: OfficerRecord[] = profileRows.map((p) => {
          const name = p.full_name || (p.email ? p.email.split('@')[0] : 'Statistical Officer');
          return {
            id: p.id,
            name,
            email: p.email || 'No email provided',
            designation: p.designation || 'Statistical Officer',
            departmentMdo: p.department_mdo || 'Ministry of Statistics & Programme Implementation',
            assessmentsCount: 0,
            overallCompetency: null,
            priorityGap: 'Not evaluated yet',
            status: 'Not Evaluated',
          };
        });
        setOfficers(records);
      }
    } catch (err) {
      console.error('[TeacherStudentsPage] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const filteredOfficers = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.departmentMdo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="Officers Directory"
        subtitle="Monitor officer competency profiles, department assignments, and identified training gaps."
        action={
          <Button variant="outline" onClick={fetchOfficers} disabled={loading}>
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by officer name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <span className="text-sm text-slate-500 whitespace-nowrap">
            Showing {filteredOfficers.length} officers
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Officer Info</th>
                <th className="p-4 font-semibold">Department / MDO</th>
                <th className="p-4 font-semibold">Competency Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Loading officers from database...
                  </td>
                </tr>
              ) : filteredOfficers.length > 0 ? (
                filteredOfficers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{officer.name}</p>
                      <p className="text-xs text-slate-500">{officer.email}</p>
                    </td>
                    <td className="p-4 text-slate-600 text-xs">{officer.departmentMdo}</td>
                    <td className="p-4">
                      <Badge variant="warning">
                        {officer.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/students/${officer.id}`)}>
                        View Passport
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    No registered officers found in database.
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
