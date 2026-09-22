import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, UserCheck, UserX, Mail, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase/client';

type UserTab = 'officers' | 'coordinators' | 'admins';

interface DBProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  designation: string | null;
  department_mdo: string | null;
  created_at?: string;
}

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<UserTab>('officers');
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching user profiles:', error.message);
      } else if (data) {
        setProfiles(data);
      }
    } catch (err) {
      console.error('Fetch profiles exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (action: string, userName: string) => {
    toast(`${action} action triggered for ${userName}`, 'info');
  };

  const getFilteredUsers = () => {
    let tabProfiles = profiles.filter((p) => {
      const normRole = (p.role || 'student').toLowerCase();
      if (activeTab === 'officers') {
        return normRole === 'student' || normRole === 'officer';
      }
      if (activeTab === 'coordinators') {
        return normRole === 'teacher' || normRole === 'training_coordinator';
      }
      return normRole === 'admin';
    });

    if (search.trim()) {
      const query = search.toLowerCase();
      tabProfiles = tabProfiles.filter(
        (p) =>
          (p.full_name && p.full_name.toLowerCase().includes(query)) ||
          (p.email && p.email.toLowerCase().includes(query)) ||
          (p.department_mdo && p.department_mdo.toLowerCase().includes(query))
      );
    }

    return tabProfiles;
  };

  const users = getFilteredUsers();

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="User & Role Management"
        subtitle="Manage statistical officers, training coordinators, and system access permissions."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => toast('Invite Officer modal opened', 'info')}>
              <UserCheck size={16} className="mr-1.5" /> Invite User
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        {/* Tabs & Search */}
        <div className="border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-slate-50/50">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            {(['officers', 'coordinators', 'admins'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearch('');
                }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'officers' ? 'Officers' : tab === 'coordinators' ? 'Training Coordinators' : 'Admins'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Designation / Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Loading users from database...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => {
                  const displayName = user.full_name || (user.email ? user.email.split('@')[0] : 'User');
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{displayName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail size={10} /> {user.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-700">
                          {user.designation || (user.role === 'teacher' ? 'Training Coordinator' : user.role === 'admin' ? 'Administrator' : 'Statistical Officer')}
                        </span>
                        {user.department_mdo && (
                          <p className="text-[10px] text-slate-400 font-semibold">{user.department_mdo}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('Edit', displayName)}
                            className="text-slate-500 hover:text-primary"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('Deactivate', displayName)}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <UserX size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    No registered {activeTab} found in database.
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
