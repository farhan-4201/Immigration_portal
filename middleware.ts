import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Define protected and public routes
const publicRoutes = ['/', '/login', '/unauthorized', '/api/auth/login'];
const adminRoutes = ['/admin', '/api/admin'];
const managerRoutes = ['/manager', '/api/manager'];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // 1. Skip middleware for static assets
    if (
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Get token
    const token = req.cookies.get('auth_token')?.value;

    // 3. Verify token (using jose - Edge compatible)
    const decoded = token ? await verifyToken(token) : null;

    // 4. Redirect logged-in users away from auth pages
    const isAuthPage = path === '/login';
    if (isAuthPage && decoded) {
        let callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/';

        // Safety: Prevent loops and malformed callbacks
        if (callbackUrl.includes('/login') || callbackUrl === path) {
            callbackUrl = '/';
        }

        return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // 5. Tenant-specific root handling
    const host = req.headers.get('host');
    const cleanHost = host?.split(':')[0].toLowerCase();

    let tenantInfo: any = null;

    if (cleanHost) {
        // Optimization: check main domains first to avoid API call
        const isMain = cleanHost === 'localhost' ||
            cleanHost === 'hrservices.me' ||
            cleanHost === 'admin.westburylaw.co.uk' ||
            cleanHost === 'portal.westburylaw.co.uk';

        if (isMain) {
            tenantInfo = { id: 'admin', name: 'System Admin', isAdmin: true };
        } else {
            try {
                // Call our standard Node.js API to resolve the tenant
                // Using req.nextUrl.origin ensures we call the same server
                const tenantRes = await fetch(`${req.nextUrl.origin}/api/auth/tenant?domain=${cleanHost}`);
                if (tenantRes.ok) {
                    tenantInfo = await tenantRes.json();
                }
            } catch (error) {
                console.error('Middleware tenant resolution failed:', error);
            }
        }
    }

    if (tenantInfo && !tenantInfo.isAdmin && path === '/') {
        // If not authenticated, force redirect to tenant login
        if (!decoded) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('callbackUrl', '/');
            return NextResponse.redirect(loginUrl);
        }
    }

    // 6. Check if route is public
    const isPublic = publicRoutes.includes(path);
    if (isPublic) {
        return NextResponse.next();
    }

    // 6. Protect private routes
    if (!decoded) {
        // For API routes, return 401 instead of redirecting to login page
        if (path.startsWith('/api/')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Redirect to login if no valid token and not a public route
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', path);
        return NextResponse.redirect(loginUrl);
    }

    // 6a. Check if user account is deactivated
    if (decoded.status === 'Deactivated') {
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('auth_token');
        return response;
    }

    // 7. Role-based protection
    const { role, companyId: userCompanyId } = decoded as any;

    // 7a. Tenant Isolation Check: 
    // If we are on a company portal, and the user is NOT an admin,
    // they MUST belong to this specific company.
    if (tenantInfo && !tenantInfo.isAdmin && role !== 'Admin') {
        if (userCompanyId !== (tenantInfo as any).id) {
            const targetName = (tenantInfo as any).name || 'Unknown Portal';
            console.log(`Access Denied: User belongs to ID ${userCompanyId}, but visited ${targetName} (ID: ${(tenantInfo as any).id})`);
            return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
    }

    // --- IMMIGRATION PORTAL PROTECTION ---
    if (path.startsWith('/cases') || path === '/') {
        if (role !== 'Case Worker' && role !== 'Admin') {
            return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
    }

    // --- GENERAL ADMIN ROUTES ---
    if (adminRoutes.some(route => path.startsWith(route)) && role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // --- GENERAL MANAGER ROUTES ---
    if (managerRoutes.some(route => path.startsWith(route)) && role !== 'Manager' && role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth api routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
