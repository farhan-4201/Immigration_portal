import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all notifications for the user from Prisma
        const dbNotifications = await prisma.notification.findMany({
            where: { recipient: decoded.userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Generate dynamic deadline notifications for Case Workers
        let deadlineNotifications: any[] = [];
        if (decoded.role === 'Case Worker') {
            const cases = await prisma.case.findMany({
                where: { assignedToId: decoded.userId }
            });
            const now = new Date();
            const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

            cases.forEach(c => {
                // Handle deadlines (stored as Json in Prisma)
                const deadlines = c.deadlines as any[] || [];
                deadlines.forEach((d: any) => {
                    const dDate = new Date(d.date);
                    // Filter for deadlines in the next 48 hours
                    if (dDate > now && dDate <= fortyEightHoursLater) {
                        deadlineNotifications.push({
                            id: `deadline-${c.id}-${dDate.getTime()}`,
                            _id: `deadline-${c.id}-${dDate.getTime()}`, // For frontend compatibility
                            type: 'Deadline',
                            title: 'Critical Deadline',
                            message: `Task "${d.title}" for Case ${c.caseNumber} is due soon.`,
                            link: `/dashboard?caseId=${c.id}`,
                            isRead: false,
                            createdAt: new Date(),
                        });
                    }
                });
            });
        }

        // Combine and sort by date
        const allNotifications = [...deadlineNotifications, ...dbNotifications.map(n => ({ ...n, _id: n.id }))];

        return NextResponse.json(allNotifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
