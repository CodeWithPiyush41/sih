import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, BarChart3, GraduationCap, LogOut } from 'lucide-react';
import type { Role } from '@/lib/types';

interface SidebarProps {
  role: Role;
  courseId?: string;
}

const teacherNav = [
  { label: 'Courses', to: '/teacher', icon: BookOpen, end: true },
  { label: 'Analytics', to: '/teacher/analytics', icon: BarChart3, end: false },
];

const studentNav = [
  { label: 'Courses', to: '/student', icon: BookOpen, end: true },
  { label: 'Assessments', to: '/student/assessments', icon: ClipboardList, end: false },
];

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const navItems = role === 'teacher' ? teacherNav : studentNav;

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
          <GraduationCap size={20} strokeWidth={1.5} className="text-signal" />
          <span className="text-h3 text-ink">SkillLens</span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-body rounded-btn transition-colors duration-150 ${
                        isActive
                          ? 'bg-signal-tint text-signal border-l-2 border-signal'
                          : 'text-ink-secondary hover:bg-bg hover:text-ink border-l-2 border-transparent'
                      }`
                    }
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-body text-ink-secondary hover:bg-bg hover:text-ink rounded-btn transition-colors duration-150 w-full"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
        <ul className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2.5 text-caption ${
                      isActive ? 'text-signal' : 'text-ink-muted'
                    }`
                  }
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
