'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/SidebarContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import NotificationCenter from '@/components/NotificationCenter';
import ThemeToggle from '@/components/ThemeToggle';
import DashboardSidebar from '@/components/DashboardSidebar';
import MobileMenuButton from '@/components/MobileMenuButton';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function DashboardLayoutClient({ children, user }: { children: React.ReactNode, user: any }) {
    const pathname = usePathname() || '';
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/unauthorized');

    if (isAuthPage) {
        return (
            <ThemeProvider>
                {children}
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <SidebarProvider>
                <div
                    className="flex min-h-screen relative overflow-hidden"
                    style={{
                        background: 'var(--background)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-main)',
                        transition: 'background-color 0.4s ease, color 0.4s ease',
                    }}
                >
                    {/* Gold CSS variable overrides for this portal */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        :root, :root.dark, :root.light {
                          --primary: #c8a96e;
                          --primary-dark: #a8863e;
                          --primary-light: #e8c98e;
                          --primary-glow: rgba(200, 169, 110, 0.18);
                          --gold: #c8a96e;
                          --gold-dim: rgba(200, 169, 110, 0.08);
                          --border-accent: rgba(200, 169, 110, 0.18);
                        }
                        :root.light {
                          --primary: #8b6b35;
                          --primary-dark: #6d511e;
                          --primary-light: #b08040;
                          --primary-glow: rgba(139, 107, 53, 0.15);
                          --gold: #8b6b35;
                          --gold-dim: rgba(139, 107, 53, 0.08);
                          --border-accent: rgba(139, 107, 53, 0.15);
                        }
                    `}} />

                    <DashboardSidebar user={user} />

                    <div
                        className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-[320px] transition-all duration-300 ml-0"
                        style={{
                            background: 'var(--background)',
                            transition: 'background-color 0.4s ease',
                        }}
                    >
                        {/* Topbar */}
                        <header
                            className="px-5 lg:px-10"
                            style={{
                                height: '68px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'sticky',
                                top: 0,
                                zIndex: 40,
                                background: 'var(--topbar-bg)',
                                borderBottom: '1px solid var(--border-primary)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {/* Search */}
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                                <MobileMenuButton />
                                <div style={{ position: 'relative', width: '100%' }} className="group">
                                <HiOutlineMagnifyingGlass style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '15px',
                                    height: '15px',
                                    color: 'var(--text-tertiary)',
                                    transition: 'color 0.2s ease',
                                    pointerEvents: 'none',
                                }} />
                                <input
                                    type="text"
                                    placeholder="Search cases, clients..."
                                    style={{
                                        width: '100%',
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '10px',
                                        padding: '9px 16px 9px 40px',
                                        fontSize: '13px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-main)',
                                        letterSpacing: '-0.005em',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-accent)';
                                        e.currentTarget.style.background = 'var(--surface-hover)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                                        e.currentTarget.style.background = 'var(--surface-secondary)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            </div>

                            {/* Right controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ThemeToggle />
                                <NotificationCenter />
                            </div>
                        </header>

                        {/* Main content */}
                        <main
                            className="flex-1 overflow-auto scrollbar-hide p-5 lg:p-10"
                            style={{
                                position: 'relative',
                                zIndex: 10,
                            }}
                        >
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}
