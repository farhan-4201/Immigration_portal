import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'Manager' && decoded.role !== 'Admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { caseId, caseWorkerId } = await req.json();

    if (!caseId) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { assignedToId: caseWorkerId || null },
      include: { assignedTo: { select: { id: true, name: true, email: true } } }
    });

    if (!updatedCase) {
      return NextResponse.json({ message: 'Case not found' }, { status: 404 });
    }

    if (caseWorkerId) {
      await prisma.notification.create({
        data: {
          recipient: caseWorkerId,
          type: 'Assignment',
          title: 'New Case Assigned',
          message: `You have been assigned to Case ${updatedCase.caseNumber} (${updatedCase.clientName}).`,
          link: `/dashboard?caseId=${updatedCase.id}`,
          caseId: updatedCase.id
        }
      });
    }

    // Map to frontend structure
    const {
      clientName, clientNationality, clientRelStatus, clientAddress, clientEmail, clientPhone, clientDob,
      immigStatus, immigHistory,
      ...rest
    } = updatedCase;

    const responseObj = {
      ...rest,
      client: {
        name: clientName,
        nationality: clientNationality,
        relationshipStatus: clientRelStatus,
        address: clientAddress,
        email: clientEmail,
        phoneNumber: clientPhone,
        dob: clientDob,
      },
      immigration: {
        status: immigStatus,
        history: immigHistory,
      },
      _id: updatedCase.id
    };

    return NextResponse.json(responseObj);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
