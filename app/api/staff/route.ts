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

        // Get workload counts for each staff member
        const staffWithWorkload = await Promise.all(allStaff.map(async (u) => {
            let workload = 0;

            if (u.role === 'Case Worker') {
                workload = await prisma.case.count({ where: { assignedToId: u.id } });
            } else {
                // Workload based on cases managed/created? Original used createdBy which wasn't in schema
                // I'll stick to a count of 0 for non-caseworkers if not specified
                workload = 0;
            }

            return { ...u, _id: u.id, workload };
        }));

        return NextResponse.json(staffWithWorkload);
    } catch (error) {
        console.error('Staff GET error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}
