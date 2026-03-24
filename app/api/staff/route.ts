import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded || (decoded.role !== 'Manager' && decoded.role !== 'Admin')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const allStaff = await prisma.user.findMany({
            where: {
                role: { in: ['Admin', 'Manager', 'Case Worker'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLogin: true
            }
        });

        // Optimize workload counts with a groupBy query instead of N+1 count queries
        const workerIds = allStaff.filter(s => s.role === 'Case Worker').map(s => s.id);
        
        let caseCounts: Record<string, number> = {};
        if (workerIds.length > 0) {
            const counts = await prisma.case.groupBy({
                by: ['assignedToId'],
                where: {
                    assignedToId: { in: workerIds },
                    status: { not: 'Approved' } // Or omit if you count all cases
                },
                _count: {
                    _all: true
                }
            });
            
            caseCounts = counts.reduce((acc, curr) => {
                if (curr.assignedToId) {
                    acc[curr.assignedToId] = curr._count._all;
                }
                return acc;
            }, {} as Record<string, number>);
        }

        const staffWithWorkload = allStaff.map((u) => {
            let workload = 0;

            if (u.role === 'Case Worker') {
                workload = caseCounts[u.id] || 0;
            }

            return { ...u, _id: u.id, workload };
        });

        return NextResponse.json(staffWithWorkload);
    } catch (error) {
        console.error('Staff GET error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
