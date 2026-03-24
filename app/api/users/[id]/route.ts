import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, email, password, role, status } = body;

        const updateData: any = { name, email, role, status };

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 12);
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: 'User updated successfully',
            user: { ...userWithoutPassword, _id: userWithoutPassword.id }
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ message: error.message || 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Unlink cases assigned to or created by this user to avoid FK constraint errors
        await prisma.case.updateMany({
            where: { assignedToId: params.id },
            data: { assignedToId: null }
        });

        // Unlink client inquiries
        await prisma.clientInquiry.updateMany({
            where: { assignedToId: params.id },
            data: { assignedToId: null }
        });

        const user = await prisma.user.delete({
            where: { id: params.id }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
    }
}
