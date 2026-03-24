import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
    try {
        // Get all users (excluding passwords)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users.map(u => ({ ...u, _id: u.id })));
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, role, status } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email, status: 'Active' }
        });
        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
        }

        // Manual password hashing
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user in Prisma
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'Case Worker',
                status: status || 'Active'
            }
        });

        return NextResponse.json({
            message: 'User created successfully',
            user: { _id: user.id, name: user.name, email: user.email, role: user.role }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ message: error.message || 'Failed to create user' }, { status: 500 });
    }
}
