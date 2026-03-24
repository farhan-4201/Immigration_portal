import { cookies, headers } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import './globals.css';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export default async function ImmigrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  // Server-side pathname detection for initial load protection only
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/unauthorized');

  let user = null;
  try {
      const token = cookies().get('auth_token')?.value;
      user = token ? await verifyToken(token) : null;
  } catch (error) {
      console.error('Layout auth error:', error);
  }

  // If not on an auth page and no valid user, force redirect to login.
  // We don't block the layout render entirely based on pathname anymore, it's delegated to the client.
  if (!user && !isAuthPage) {
      redirect('/login?callbackUrl=/');
  }

  return (
    <html lang="en">
      <body>
          <DashboardLayoutClient user={user}>
            {children}
          </DashboardLayoutClient>
      </body>
    </html>
  );
}
