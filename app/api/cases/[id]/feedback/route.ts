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

        // ONLY Admin and Manager can provide advice
        if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'Manager')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const { advice } = await req.json();

        if (!advice) {
            return NextResponse.json({ message: 'Advice content is required' }, { status: 400 });
        }

        const updatedCase = await prisma.case.update({
            where: { id },
            data: {
                adminAdvice: advice,
                adviceUpdatedAt: new Date(),
                hasNewAdvice: true,
                lastUpdatedByCaseworker: false,
            },
            include: { assignedTo: { select: { id: true, name: true, email: true } } }
        });

        if (!updatedCase) {
            return NextResponse.json({ message: 'Case not found' }, { status: 404 });
        }

        if (updatedCase.assignedToId) {
            await prisma.notification.create({
                data: {
                    recipient: updatedCase.assignedToId,
                    type: 'Advice', // Matching Prisma literal/string if not using enum
                    title: 'Action Required: Advice',
                    message: `Admin provided specific instructions for Case ${updatedCase.caseNumber}.`,
                    link: `/dashboard?caseId=${updatedCase.id}`,
                    caseId: updatedCase.id
                }
            });
        }

        return NextResponse.json({ ...updatedCase, _id: updatedCase.id });
    } catch (error) {
        console.error('Feedback submission error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
