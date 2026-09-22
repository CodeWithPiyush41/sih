import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Plus, BookOpen, Users, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase/client';

interface DBCourse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
}

export function AdminCoursesPage() {
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[AdminCoursesPage] Error fetching courses:', error.message);
      } else if (data) {
        setCourses(data);
      }
    } catch (err) {
      console.error('[AdminCoursesPage] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAction = (action: string, courseName: string) => {
    toast(`${action} action triggered for ${courseName}`, 'info');
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Training Programmes Management"
        subtitle="Manage official statistical training programmes, competency mappings, and assigned coordinators."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchCourses} disabled={loading}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => toast('Create Programme modal opened', 'info')}>
              <Plus size={16} className="mr-1.5" /> Create Training Programme
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="border-b border-slate-100 p-4 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search training programmes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Programme Title</th>
                <th className="p-4 font-semibold">Programme Code</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Loading training programmes from database...
                  </td>
                </tr>
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{course.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {course.description || 'Official Statistical Competency Programme'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{course.code || 'STAT-101'}</td>
                    <td className="p-4">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction('Edit', course.name)}
                          className="text-slate-500 hover:text-primary"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction('Delete', course.name)}
                          className="text-slate-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    No training programmes found in database.
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
