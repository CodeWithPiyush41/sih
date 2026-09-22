import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, FileText, LayoutDashboard, GitMerge, Settings, Plus, Activity, BookOpen, ShieldCheck } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);

  useEffect(() => {
    async function loadAdminAnalytics() {
      setLoading(true);
      try {
        const { data: { session } } = await (window as any).supabase?.auth?.getSession?.() || { data: { session: null } };
        const token = session?.access_token || '';
        const res = await fetch('/api/analytics/admin', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAdminAnalytics(data);
        }
      } catch (err) {
        console.warn('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminAnalytics();
  }, []);

  const totalUsers = adminAnalytics?.totalUsers ?? 0;
  const totalStudents = adminAnalytics?.totalStudents ?? 0;
  const assessedStudentsCount = adminAnalytics?.assessedStudentsCount ?? 0;
  const unassessedStudentsCount = adminAnalytics?.unassessedStudentsCount ?? 0;
  const overallAverageScore = adminAnalytics?.overallAverageScore;
  const verifiedIGOTCount = adminAnalytics?.verifiedIGOTResourcesCount ?? 0;
  const verifiedNSSTACount = adminAnalytics?.verifiedNSSTAProgrammesCount ?? 0;

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Admin Control Panel — Official Statistical System"
        subtitle="Platform-wide institutional competency governance, catalogue management, and security oversight."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/users')}>
              Manage Officers & Roles
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/igot/import')}>
              <Plus size={16} className="mr-1.5" /> iGOT / NSSTA Catalog
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Registered Officers</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : totalStudents}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Assessed Officers</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : assessedStudentsCount}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Unassessed Officers</p>
            <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : unassessedStudentsCount}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <GitMerge size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Overall Competency Avg</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? '...' : overallAverageScore !== null ? `${overallAverageScore}%` : 'Not evaluated'}
            </h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Verified Catalog Statistics */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verified Learning Resources Catalog</h3>
                <p className="text-xs text-slate-500">Live database counts of verified public MoSPI training resources</p>
              </div>
              <Badge variant="success">Dual Mapping Active</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">iGOT Karmayogi Catalog</span>
                  <span className="text-lg font-bold text-indigo-900">{loading ? '...' : verifiedIGOTCount}</span>
                </div>
                <p className="text-xs text-slate-600">Curated & verified public courses mapped to statistical competency gaps.</p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">NSSTA / TPAC MoSPI Catalog</span>
                  <span className="text-lg font-bold text-emerald-900">{loading ? '...' : verifiedNSSTACount}</span>
                </div>
                <p className="text-xs text-slate-600">Official MoSPI training calendar programmes verified by NSSTA.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/igot/import')}>
              Manage Verified Catalogs &rarr;
            </Button>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-base mb-4">System Governance</h3>
          
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-sm font-semibold text-slate-900 mb-0.5">Four-Domain Competency Matrix</p>
                 <p className="text-xs text-slate-500 font-medium">Statistical, Tech, Digital Gov, Managerial</p>
               </div>
               <Badge variant="success">Active</Badge>
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-sm font-semibold text-slate-900 mb-0.5">Supabase Auth & RLS</p>
                 <p className="text-xs text-slate-500 font-medium">Row-Level Security Protected</p>
               </div>
               <Badge variant="success">Enforced</Badge>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => navigate('/settings')}>
              <Settings size={15} className="mr-1.5" /> Settings
            </Button>
            <Button variant="outline" className="flex-1 text-xs" onClick={() => navigate('/admin/ai-status')}>
              <Activity size={15} className="mr-1.5" /> AI Engine
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
