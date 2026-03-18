import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { logAuditEvent, AuditEventType } from '@/lib/audit';
import { serialize } from 'cookie';
import { getCompanyByDomain, isMainDomain } from '@/lib/multitenancy';

export async function POST(req: NextRequest) {
    try {
        const { email, password, username } = await req.json();
        const host = req.headers.get('host');
        const onMainDomain = isMainDomain(host);
        const tenantInfo = onMainDomain ? null : await getCompanyByDomain(host);

        console.log(`Login attempt from: ${host}, tenant: ${tenantInfo?.id || 'admin'}`);

        if (!email && !username) {
            return NextResponse.json(
                { message: 'Email or username and password are required' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { message: 'Password is required' },
                { status: 400 }
            );
        }

        // --- TENANT LOGIN (subdomain) ---
        if (tenantInfo && !onMainDomain) {
            // Tenant users authenticate as portal users (role: CompanyPortal) using email/password
            if (!email) {
                return NextResponse.json({ message: 'Email is required for tenant login' }, { status: 400 });
            }

            const lowerEmail = email.toLowerCase().trim();

            const tenantUser = await prisma.user.findFirst({ where: { email: lowerEmail, companyId: (tenantInfo as any).id, role: 'CompanyPortal' } });

            if (!tenantUser) {
                return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
            }

            if (tenantUser.status === 'Deactivated') {
                return NextResponse.json({ message: 'Account is deactivated. Please contact administrator.' }, { status: 403 });
            }

            const isMatch = await bcrypt.compare(password, tenantUser.password);
            if (!isMatch) {
                return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
            }

            // Success - Tenant portal user login
            const token = await signToken({
                userId: tenantUser.id.toString(),
                role: tenantUser.role,
                email: tenantUser.email,
                name: tenantUser.name,
                status: tenantUser.status,
                companyId: tenantUser.companyId
            });

            await prisma.user.update({ where: { id: tenantUser.id }, data: { lastLogin: new Date() } });

            const response = NextResponse.json({ message: 'Login successful', user: { id: tenantUser.id, name: tenantUser.name, email: tenantUser.email, role: tenantUser.role } }, { status: 200 });

            response.headers.set('Set-Cookie', serialize('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 8, path: '/' }));

            return response;
        }

        // --- ADMIN/MAIN DOMAIN LOGIN ---
        if (!onMainDomain) {
            return NextResponse.json(
                { message: 'Access denied. Invalid domain.' },
                { status: 403 }
            );
        }

        const lowerEmail = email?.toLowerCase().trim() || '';


        // Search for user in Prisma (admin/manager users)
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (user.status === 'Deactivated') {
            return NextResponse.json(
                { message: 'Account is deactivated. Please contact administrator.' },
                { status: 403 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Success - Admin/Manager user login
        const token = await signToken({
            userId: user.id.toString(),
            role: user.role,
            email: user.email,
            name: user.name,
            status: user.status,
            companyId: (user as any).companyId
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        try {
            await logAuditEvent(
                AuditEventType.LOGIN_SUCCESS,
                `User logged in successfully: ${email}`,
                user.id.toString(),
                user.id.toString(),
                req.headers.get('x-forwarded-for') || undefined
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        const response = NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            },
            { status: 200 }
        );

        response.headers.set(
            'Set-Cookie',
            serialize('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 8,
                path: '/',
            })
        );

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

