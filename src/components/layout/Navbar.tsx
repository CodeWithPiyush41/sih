import { Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDisplayRoleLabel } from '@/lib/auth/roles';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export function Navbar({ onToggleMobileSidebar }: NavbarProps) {
  const { user } = useAuth();

  const roleTitle = getDisplayRoleLabel(user?.role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-500 rounded-lg md:hidden hover:bg-slate-100 hover:text-slate-700"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            India Official Statistical System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-primary/10 border border-primary/20 text-primary-dark rounded-full font-semibold text-sm">
            {user?.fullName?.charAt(0) || <UserIcon size={18} />}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.fullName || 'Statistical Officer'}
            </span>
            <span className="text-xs text-slate-500">{roleTitle}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
