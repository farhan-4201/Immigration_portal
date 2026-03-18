'use client';

import { HiOutlineSquares2X2, HiOutlineBriefcase, HiOutlineUsers, HiOutlineBell, HiChevronRight, HiChevronLeft, HiOutlineShieldCheck } from 'react-icons/hi2';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { useSidebar } from '@/components/SidebarContext';

interface DashboardSidebarProps {
  user: any;
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <>
      <aside
        className="fixed top-0 left-0 h-screen w-80 bg-sidebar-bg border-r border-border-primary p-8 flex flex-col z-20 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center gap-4 mb-12 relative font-sans">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HiOutlineSquares2X2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-black text-2xl tracking-tighter text-text-primary">CRM Portal</span>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-4 ml-2">Main Menu</p>
          <nav className="flex flex-col gap-1.5">
            {[
              { href: '/', label: 'Dashboard', icon: HiOutlineSquares2X2 },
              { href: '/cases', label: 'Case Files', icon: HiOutlineBriefcase },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3.5 p-3.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all group font-semibold"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
                <span>{item.label}</span>
              </Link>
            ))}

            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <>
                <Link href="/users" className="flex items-center gap-3.5 p-3.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all group font-semibold">
                  <HiOutlineUsers className="w-5 h-5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
                  <span>Staff Members</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-4 ml-2">Admin Center</p>
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/notifications"
              className="flex items-center gap-3.5 p-3.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all group font-semibold"
            >
              <HiOutlineBell className="w-5 h-5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
              <span>Notifications</span>
            </Link>
            <div className="pt-1">
              <LogoutButton />
            </div>
          </nav>
        </div>

        <div className="mt-auto pt-8 border-t border-border-primary">
          <div className="flex items-center gap-4 p-1">
            <div className="w-12 h-12 rounded-2xl bg-surface-primary border border-border-secondary flex items-center justify-center text-text-primary font-black text-xl shadow-lg">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-text-primary">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
