import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

/* ----------------------------- POST: Create Inquiry + Case ----------------------------- */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const decoded = token ? await verifyToken(token) : null;

    if (
      !decoded ||
      !['Admin', 'Manager', 'Case Worker'].includes(decoded.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    /* -------- Generate Case Number -------- */
    const count = await prisma.clientInquiry.count();
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    const caseNumber = `IMM-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(4, '0')}-${uniqueSuffix}`;

    /* -------- Assignment Logic -------- */
    let assignedToId =
      data.assignedTo && data.assignedTo.trim() !== ''
        ? data.assignedTo
        : null;

    // Auto-assign if Case Worker
    if (decoded.role === 'Case Worker' && !assignedToId) {
      assignedToId = decoded.userId;
    }

    const inquiryStatus = data.status || 'Inquiry';
    const caseStatus = 'Initial Query';

    const documents = Array.isArray(data.idDocuments)
      ? data.idDocuments
      : data.idDocuments?.split(',').map((d: string) => d.trim()) || [];

    /* -------- 1️⃣ Save Client Inquiry -------- */
    const createdInquiry = await prisma.clientInquiry.create({
      data: {
        caseNumber,
        name: data.name,
        nationality: data.nationality,
        idDocuments: documents,
        immigrationStatus: data.immigrationStatus,
        immigrationHistory: data.immigrationHistory,
        relationshipStatus: data.relationshipStatus,
        residentialAddress: data.residentialAddress,
        capturedById: decoded.userId,
        staffType: decoded.role,
        assignedToId,
        email: data.email,
        phoneNumber: data.phoneNumber,
        dob: new Date(data.dob),
        deadlines: data.deadlines || [],
        domain: data.domain,
        status: inquiryStatus,
      }
    });

    /* -------- 2️⃣ Create Case -------- */
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        clientName: data.name,
        clientNationality: data.nationality,
        clientRelStatus: data.relationshipStatus,
        clientAddress: data.residentialAddress,
        clientEmail: data.email,
        clientPhone: data.phoneNumber,
        clientDob: new Date(data.dob),
        immigStatus: data.immigrationStatus,
        immigHistory: data.immigrationHistory,
        documents,
        deadlines: data.deadlines || [],
        status: caseStatus,
        createdById: decoded.userId,
        assignedToId,
        inquiryId: createdInquiry.id,
      }
    });

    if (assignedToId && assignedToId !== decoded.userId) {
      await prisma.notification.create({
        data: {
          recipient: assignedToId,
          type: 'Assignment',
          title: 'New Case Assigned',
          message: `Case ${caseNumber} (${data.name}) was created and assigned to you.`,
          link: `/dashboard?caseId=${newCase.id}`,
          caseId: newCase.id
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry and case created successfully',
        caseNumber: newCase.caseNumber,
        caseId: newCase.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('INQUIRY_CREATION_ERROR:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ----------------------------- GET: Fetch Inquiries ----------------------------- */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const decoded = token ? await verifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const inquiries = await prisma.clientInquiry.findMany({
      where: decoded.role === 'Admin' || decoded.role === 'Manager'
        ? {}
        : { assignedToId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(inquiries.map(i => ({ ...i, _id: i.id })));
  } catch (error) {
    console.error('FETCH_INQUIRIES_ERROR:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
