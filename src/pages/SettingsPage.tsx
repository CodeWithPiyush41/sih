import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDisplayRoleLabel } from '@/lib/auth/roles';
import { Save, User as UserIcon, Bell, Building2, Briefcase } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayRole = getDisplayRoleLabel(user?.role);

  return (
    <DashboardLayout role={user?.role || 'student'}>
      <PageHeader
        title="Account & System Settings"
        subtitle="Manage official officer profile information, notification preferences, and system settings."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <UserIcon size={20} className="text-primary" />
            <h3 className="font-bold text-slate-900 text-base">Officer Profile Details</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input label="Email Address" value={user?.email || 'Not provided'} disabled />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Role
                </label>
                <input
                  type="text"
                  value={displayRole}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={user?.designation || 'Statistical Officer'}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department / MDO
                </label>
                <input
                  type="text"
                  value={user?.departmentMdo || 'Not provided'}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  value={user?.yearsExperience != null ? `${user.yearsExperience} years experience` : 'Not provided'}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saved ? (
                <span className="text-xs text-emerald-600 font-medium">Settings saved successfully!</span>
              ) : (
                <span />
              )}
              <Button type="submit" variant="primary">
                <Save size={16} className="mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-secondary" />
            <h3 className="font-bold text-slate-900 text-base">Notifications</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
              <span>Email notification when an assessment result is published</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
              <span>Weekly skill gap remediation summary digest</span>
            </label>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
