import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'Manager' && decoded.role !== 'Admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const caseWorkers = await prisma.user.findMany({
      where: { role: 'Case Worker' },
      select: { id: true, name: true, email: true }
    });

    const formattedCaseWorkers = caseWorkers.map(cw => ({
      ...cw,
      _id: cw.id
    }));

    return NextResponse.json(formattedCaseWorkers);
  } catch (error) {
    console.error('Caseworkers GET error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
