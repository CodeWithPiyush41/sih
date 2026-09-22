import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Target,
  GitMerge,
  LineChart,
  Settings,
  ShieldCheck,
  LogOut,
  Users,
  Award,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { Role } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDisplayRoleLabel } from '@/lib/auth/roles';

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: any;
  end?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

export function Sidebar({ role, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const officerNavigation: NavGroup[] = [
    {
      section: 'OVERVIEW',
      items: [{ label: 'Dashboard', to: '/student', icon: LayoutDashboard, end: true }],
    },
    {
      section: 'COMPETENCY & LEARNING',
      items: [
        { label: 'Training Materials', to: '/student/materials', icon: FileText },
        { label: 'Assessments', to: '/student/assessments', icon: Award },
        { label: 'Competency Passport', to: '/student/passport', icon: Target },
        { label: 'AI Assistant', to: '/student/assistant', icon: Sparkles },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [{ label: 'Settings', to: '/settings', icon: Settings }],
    },
  ];

  const coordinatorNavigation: NavGroup[] = [
    {
      section: 'OVERVIEW',
      items: [{ label: 'Coordinator Dashboard', to: '/teacher', icon: LayoutDashboard, end: true }],
    },
    {
      section: 'TRAINING & OFFICERS',
      items: [
        { label: 'Officers Directory', to: '/teacher/students', icon: Users },
        { label: 'Coordinator Assessments', to: '/teacher/assessments', icon: Award },
        { label: 'Training Materials', to: '/teacher/materials', icon: FileText },
      ],
    },
    {
      section: 'ANALYTICS & EFFECTIVENESS',
      items: [
        { label: 'Competency Analytics', to: '/teacher/analytics', icon: LineChart },
        { label: 'Training Effectiveness', to: '/teacher/analytics', icon: Target },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [{ label: 'Settings', to: '/settings', icon: Settings }],
    },
  ];

  const adminNavigation: NavGroup[] = [
    {
      section: 'OVERVIEW',
      items: [{ label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard, end: true }],
    },
    {
      section: 'USER MANAGEMENT',
      items: [
        { label: 'Officers', to: '/admin/users', icon: Users },
        { label: 'Training Coordinators', to: '/admin/users', icon: ShieldCheck },
      ],
    },
    {
      section: 'CURRICULUM & CATALOGS',
      items: [
        { label: 'Assessments', to: '/admin/courses', icon: Award },
        { label: 'Training Materials', to: '/admin/assignments', icon: FileText },
        { label: 'Competencies', to: '/admin/assignments', icon: GitMerge },
        { label: 'iGoT Catalog', to: '/admin/igot/import', icon: UploadCloud },
        { label: 'NSSTA/TPAC', to: '/admin/courses', icon: BookOpen },
      ],
    },
    {
      section: 'SYSTEM & ANALYTICS',
      items: [
        { label: 'Analytics', to: '/admin/ai-status', icon: LineChart },
        { label: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  const navigation =
    role === 'admin'
      ? adminNavigation
      : role === 'teacher' || role === 'training_coordinator'
      ? coordinatorNavigation
      : officerNavigation;

  const displayRoleLabel = getDisplayRoleLabel(role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              SkillLens <span className="text-secondary font-semibold">AI</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Official Statistical System
            </span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        {navigation.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                          isActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'O'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.fullName || (user?.email ? user.email.split('@')[0] : 'Statistical Officer')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">{displayRoleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl bg-white animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
