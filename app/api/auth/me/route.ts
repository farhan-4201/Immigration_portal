import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const decoded = await verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        // Get user from Prisma
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLogin: true
            }
        });

        if (!user || user.status === 'Deactivated') {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Me route error:', error);
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
