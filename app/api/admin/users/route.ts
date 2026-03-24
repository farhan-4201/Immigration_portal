import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { logAuditEvent, AuditEventType } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (decoded?.role !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users.map(u => ({ ...u, _id: u.id })));
    } catch (error) {
        console.error('Admin users GET error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (decoded?.role !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { name, email, password, role } = await req.json();
        const lowerEmail = email.toLowerCase();

        const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email: lowerEmail,
                password: hashedPassword,
                role,
                status: 'Active'
            }
        });

        await logAuditEvent(
            AuditEventType.ROLE_CHANGE,
            `New user manually created by Admin (${decoded.userId}): ${email} as ${role}`,
            user.id.toString(),
            decoded.userId
        );

        return NextResponse.json({ message: 'User created' }, { status: 201 });
    } catch (error) {
        console.error('Admin users POST error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (decoded?.role !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { userId, status, role } = await req.json();

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const oldRole = user.role;
        const oldStatus = user.status;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: status || user.status,
                role: role || user.role
            }
        });

        if (role && role !== oldRole) {
            await logAuditEvent(
                AuditEventType.ROLE_CHANGE,
                `Role changed from ${oldRole} to ${role} for user ${user.email}`,
                user.id.toString(),
                decoded.userId
            );
        } else if (status && status !== oldStatus && status === 'Deactivated') {
            await logAuditEvent(
                AuditEventType.ACCOUNT_DEACTIVATION,
                `Account deactivated for user ${user.email}`,
                user.id.toString(),
                decoded.userId
            );
        }

        return NextResponse.json({ message: 'User updated' });
    } catch (error) {
        console.error('Admin PATCH error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (decoded?.role !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { userId, newPassword } = await req.json();

        if (!userId || !newPassword) {
            return NextResponse.json({ message: 'Missing userId or newPassword' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                loginAttempts: 0,
                lockUntil: null
            }
        });

        await logAuditEvent(
            AuditEventType.ROLE_CHANGE,
            `Admin (${decoded.userId}) changed password for user ${user.email}`,
            user.id.toString(),
            decoded.userId
        );

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
