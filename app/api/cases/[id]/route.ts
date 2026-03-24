import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper function to map Prisma Case to frontend format
const mapCaseToFrontend = (c: any, decodedRole: string) => {
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
        _id: c.id,
    };

    if (decodedRole !== 'Case Worker') {
        delete caseObj.caseworkerNote;
    }
    return caseObj;
};

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const caseDoc = await prisma.case.findUnique({
            where: { id: params.id },
            include: { assignedTo: { select: { id: true, name: true, email: true } } }
        });

        if (!caseDoc) {
            return NextResponse.json({ message: 'Case not found' }, { status: 404 });
        }

        return NextResponse.json(mapCaseToFrontend(caseDoc, decoded.role));
    } catch (error) {
        console.error('Fetch case error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { status, assignedTo, deadlines, client, immigration, caseworkerNote } = body;

        const existingCase = await prisma.case.findUnique({ where: { id } });
        if (!existingCase) {
            return NextResponse.json({ message: 'Case not found' }, { status: 404 });
        }

        if (
            decoded.role !== 'Admin' &&
            decoded.role !== 'Manager' &&
            existingCase.assignedToId !== decoded.userId
        ) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const updateData: any = {};
        if (['Admin', 'Manager'].includes(decoded.role)) {
            if (status) updateData.status = status;
            if (assignedTo !== undefined) updateData.assignedToId = (typeof assignedTo === 'object' ? assignedTo?.id || assignedTo?._id : assignedTo) || null;
            if (deadlines) updateData.deadlines = deadlines;

            if (client) {
                if (client.name) updateData.clientName = client.name;
                if (client.nationality) updateData.clientNationality = client.nationality;
                if (client.relationshipStatus) updateData.clientRelStatus = client.relationshipStatus;
                if (client.address) updateData.clientAddress = client.address;
                if (client.email) updateData.clientEmail = client.email;
                if (client.phoneNumber) updateData.clientPhone = client.phoneNumber;
                if (client.dob) updateData.clientDob = new Date(client.dob);
            }

            if (immigration) {
                if (immigration.status) updateData.immigStatus = immigration.status;
                if (immigration.history) updateData.immigHistory = immigration.history;
            }
            updateData.lastUpdatedByCaseworker = false;
        } else if (decoded.role === 'Case Worker') {
            if (status) updateData.status = status;
            if (deadlines) updateData.deadlines = deadlines;
            if (immigration) {
                if (immigration.status) updateData.immigStatus = immigration.status;
                if (immigration.history) updateData.immigHistory = immigration.history;
            }
            if (caseworkerNote !== undefined) updateData.caseworkerNote = caseworkerNote;
            updateData.lastUpdatedByCaseworker = true;
            updateData.hasNewAdvice = false;
        }

        const updatedCase = await prisma.case.update({
            where: { id },
            data: updateData,
            include: { assignedTo: { select: { id: true, name: true, email: true } } }
        });

        if (decoded.role === 'Case Worker') {
            const adminsAndManagers = await prisma.user.findMany({
                where: { role: { in: ['Admin', 'Manager'] } }
            });

            const notifications = adminsAndManagers.map(user => ({
                recipient: user.id,
                type: 'System',
                title: 'Case Updated by Caseworker',
                message: `Caseworker ${decoded.email || 'Staff'} updated Case ${existingCase.caseNumber}`,
                link: `/?caseId=${id}`,
                caseId: id,
                isRead: false,
            }));

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications });
            }
        }

        return NextResponse.json(mapCaseToFrontend(updatedCase, decoded.role));
    } catch (error) {
        console.error('Case update error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        const decoded = token ? await verifyToken(token) : null;

        if (!decoded || decoded.role !== 'Admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await prisma.case.delete({ where: { id: params.id } });
        return NextResponse.json({ message: 'Case deleted successfully' });
    } catch (error) {
        console.error('Case deletion error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
