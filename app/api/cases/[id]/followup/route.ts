import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Allow Manager, Admin, and Case Worker to add followups
        if (!['Manager', 'Admin', 'Case Worker'].includes(decoded.role)) {
            return NextResponse.json({ message: 'You do not have permission to add followups' }, { status: 403 });
        }

        const { message, type } = await req.json();

        if (!message || message.trim() === '') {
            return NextResponse.json({ message: 'Followup message is required' }, { status: 400 });
        }

        const caseDoc = await prisma.case.findUnique({
            where: { id: params.id },
            include: { assignedTo: true, createdBy: true }
        });

        if (!caseDoc) {
            return NextResponse.json({ message: 'Case not found' }, { status: 404 });
        }

        // Add followup to case with role information
        const currentFollowups = (caseDoc.followups as any[]) || [];
        const newFollowup = {
            id: Math.random().toString(36).substring(2, 9),
            createdBy: decoded.userId,
            message: message.trim(),
            role: decoded.role,
            type: type || 'Note',
            createdAt: new Date().toISOString(),
        };

        const updatedFollowups = [...currentFollowups, newFollowup];

        await prisma.case.update({
            where: { id: params.id },
            data: {
                followups: updatedFollowups,
                updatedAt: new Date()
            }
        });

        // Create notifications for all relevant parties except the sender
        // ONLY if not a Private Note
        if (type !== 'Private Note') {
            const recipients: string[] = [];

            // Add assigned case worker if not the sender
            if (caseDoc.assignedToId && caseDoc.assignedToId !== decoded.userId) {
                recipients.push(caseDoc.assignedToId);
            }

            // Find all admins and managers
            const adminsAndManagers = await prisma.user.findMany({
                where: {
                    role: { in: ['Admin', 'Manager'] }
                }
            });

            adminsAndManagers.forEach((user) => {
                // Don't send notification to the sender
                if (user.id !== decoded.userId && !recipients.includes(user.id)) {
                    recipients.push(user.id);
                }
            });

            // Create notification for each recipient
            if (recipients.length > 0) {
                const notificationsData = recipients.map(recipientId => ({
                    recipient: recipientId,
                    type: 'Followup', // Matching Prisma literal/string if not using enum
                    title: `New Followup from ${decoded.role}`,
                    message: `${decoded.role} added a followup to Case ${caseDoc.caseNumber}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                    link: `/dashboard?caseId=${caseDoc.id}`,
                    caseId: caseDoc.id,
                    isRead: false,
                }));

                await prisma.notification.createMany({
                    data: notificationsData
                });
            }
        }

        return NextResponse.json({
            message: 'Followup added successfully',
            followup: newFollowup
        });
    } catch (error) {
        console.error('Add followup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
