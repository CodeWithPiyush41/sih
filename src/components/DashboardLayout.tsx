import type { Role } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';

interface LayoutProps {
  role: Role;
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="max-w-[1080px] px-6 md:px-8 lg:px-12 py-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
