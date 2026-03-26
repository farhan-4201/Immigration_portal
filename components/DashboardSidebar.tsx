'use client';

import { HiOutlineSquares2X2, HiOutlineBriefcase, HiOutlineUsers, HiOutlineBell, HiOutlineShieldCheck } from 'react-icons/hi2';
import { FiLogOut } from 'react-icons/fi';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { useSidebar } from '@/components/SidebarContext';
import { usePathname } from 'next/navigation';

interface DashboardSidebarProps {
  user: any;
}

const navMain = [
  { href: '/', label: 'Dashboard', icon: HiOutlineSquares2X2 },
  { href: '/cases', label: 'Case Files', icon: HiOutlineBriefcase },
];

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();
  const pathname = usePathname() || '';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={`fixed top-0 left-0 h-screen w-80 flex flex-col z-50 overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-primary)',
        }}
      >
      {/* Sidebar gold accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '1px',
        height: '100%',
        background: 'linear-gradient(180deg, transparent 0%, var(--primary) 30%, var(--primary) 70%, transparent 100%)',
        opacity: 0.08,
      }} />

      {/* Header / Logo */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex items-center gap-3.5 mb-1">
          {/* Monogram mark */}
          <div style={{
            width: 36,
            height: 36,
            background: 'var(--gold-dim)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, transparent 40%, rgba(200,169,110,0.1) 100%)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--primary)',
              lineHeight: 1,
              position: 'relative',
              zIndex: 1,
            }}>W</span>
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>Westbury</h1>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              opacity: 0.7,
            }}>Legal CRM Portal</span>
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div className="mx-8 mb-8" style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-accent) 50%, transparent)',
        opacity: 0.5,
      }} />

      {/* Navigation */}
      <div className="px-5 flex-1">
        <div className="mb-7">
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            paddingLeft: '12px',
            display: 'block',
            marginBottom: '10px',
          }}>Navigation</span>

          <nav className="flex flex-col gap-1">
            {navMain.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    background: active ? 'var(--gold-dim)' : 'transparent',
                    border: active ? '1px solid var(--border-accent)' : '1px solid transparent',
                    fontWeight: active ? 500 : 400,
                    fontSize: '14px',
                    letterSpacing: '-0.005em',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '2px',
                      background: 'var(--primary)',
                      borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <item.icon style={{
                    width: 17,
                    height: 17,
                    opacity: active ? 1 : 0.55,
                    flexShrink: 0,
                    transition: 'opacity 0.2s ease',
                  }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <Link
                href="/users"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  color: isActive('/users') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/users') ? 'var(--gold-dim)' : 'transparent',
                  border: isActive('/users') ? '1px solid var(--border-accent)' : '1px solid transparent',
                  fontWeight: isActive('/users') ? 500 : 400,
                  fontSize: '14px',
                  letterSpacing: '-0.005em',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/users')) {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/users')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {isActive('/users') && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '2px',
                    background: 'var(--primary)',
                    borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <HiOutlineUsers style={{ width: 17, height: 17, opacity: isActive('/users') ? 1 : 0.55, flexShrink: 0, transition: 'opacity 0.2s ease' }} />
                <span>Staff Members</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Secondary section */}
        <div className="mb-7">
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            paddingLeft: '12px',
            display: 'block',
            marginBottom: '10px',
          }}>System</span>

          <nav className="flex flex-col gap-1">
            <Link
              href="/notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '10px',
                color: isActive('/notifications') ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive('/notifications') ? 'var(--gold-dim)' : 'transparent',
                border: isActive('/notifications') ? '1px solid var(--border-accent)' : '1px solid transparent',
                fontWeight: isActive('/notifications') ? 500 : 400,
                fontSize: '14px',
                letterSpacing: '-0.005em',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive('/notifications')) {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/notifications')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive('/notifications') && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '2px',
                  background: 'var(--primary)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <HiOutlineBell style={{ width: 17, height: 17, opacity: isActive('/notifications') ? 1 : 0.55, flexShrink: 0 }} />
              <span>Notifications</span>
            </Link>

            <div style={{ paddingTop: 4 }}>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </div>

      {/* User profile footer */}
      <div className="px-5 pb-8">
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border-primary) 50%, transparent)',
          marginBottom: '20px',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border-primary)',
          transition: 'all 0.2s ease',
        }}>
          {/* Avatar */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'var(--gold-dim)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--primary)',
            }}>{user?.email?.[0]?.toUpperCase() || '?'}</span>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
            }}>{user?.name || user?.email?.split('@')[0] || 'User'}</p>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              opacity: 0.75,
            }}>{user?.role}</span>
          </div>

          <HiOutlineShieldCheck style={{ width: 14, height: 14, color: 'var(--primary)', opacity: 0.5, flexShrink: 0 }} />
        </div>
      </div>
    </aside>
    </>
  );
}
