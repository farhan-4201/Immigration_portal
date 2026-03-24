import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { SidebarProvider } from '@/components/SidebarContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import NotificationCenter from '@/components/NotificationCenter';
import ThemeToggle from '@/components/ThemeToggle';
import DashboardSidebar from '@/components/DashboardSidebar';
import './globals.css';

export default async function ImmigrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get('auth_token')?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return (
      <html lang="en">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
        <SidebarProvider>
      <div className="flex min-h-screen bg-background text-text-primary relative overflow-hidden font-sans transition-colors duration-300">
        {/* Inject Immigration Theme Colors (Blue) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          :root, :root.dark, :root.light {
            --primary: #2563eb !important;
            --primary-glow: rgba(37, 99, 235, 0.2) !important;
          }
        `}} />

        <DashboardSidebar user={user} />

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-background transition-colors duration-300 ml-80">
          <header className="h-16 md:h-24 flex items-center justify-between px-4 md:px-10 z-50 relative bg-topbar-bg border-border-primary transition-all duration-300">
            <div className="relative w-full max-w-[200px] md:max-w-96 group">
              <HiOutlineMagnifyingGlass className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-text-tertiary group-focus-within:text-[#2563eb] transition-colors" />
              <input
                type="text"
                placeholder="Search Immigration Cases..."
                className="w-full bg-surface-secondary border border-border-secondary rounded-xl md:rounded-2xl py-2 md:py-3.5 pl-10 md:pl-14 pr-4 md:pr-6 text-xs md:text-sm text-text-primary placeholder:text-text-tertiary focus:bg-surface-hover focus:border-[#2563eb] transition-all outline-none font-medium shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-12 z-10 relative scrollbar-hide">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </ThemeProvider>
      </body>
    </html>
  );
}
