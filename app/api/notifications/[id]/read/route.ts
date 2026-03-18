import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // If it's a virtual deadline notification, we don't have a DB record to update
        if (id.startsWith('deadline-')) {
            return NextResponse.json({ success: true, message: 'Virtual notification dismissed' });
        }

        const updated = await prisma.notification.update({
            where: { id, recipient: decoded.userId },
            data: { isRead: true }
        });

        if (!updated) {
            return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ ...updated, _id: updated.id });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
