import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let where: any = {};

    if (decoded.role === 'Case Worker') {
      where = { assignedToId: decoded.userId };
    } else if (decoded.role === 'Manager' || decoded.role === 'Admin') {
      where = {};
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const cases = await prisma.case.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map Prisma flat structure to nested structure expected by frontend
    const filteredCases = cases.map(c => {
      const {
        clientName, clientNationality, clientRelStatus, clientAddress, clientEmail, clientPhone, clientDob,
        immigStatus, immigHistory,
        ...rest
      } = c;

      const caseObj: any = {
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
        _id: c.id, // Compatibility with mongoose _id if needed
      };

      // Privacy Filter: Only Case Workers see their notes
      if (decoded.role !== 'Case Worker') {
        delete caseObj.caseworkerNote;
      }

      return caseObj;
    });

    return NextResponse.json(filteredCases);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
