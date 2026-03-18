import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get('domain');

        if (!domain) {
            return NextResponse.json(null);
        }

        const cleanHost = domain.toLowerCase();

        // 1. Check if it's the main admin domain or localhost (though usually handled in middleware)
        if (
            cleanHost === 'localhost' ||
            cleanHost === 'hrservices.me' ||
            cleanHost === 'admin.westburylaw.co.uk' ||
            cleanHost === 'portal.westburylaw.co.uk'
        ) {
            return NextResponse.json({ id: 'admin', name: 'System Admin', isAdmin: true });
        }

        // 2. Lookup company by domain in DB
        let company = await prisma.company.findUnique({
            where: { domain: cleanHost },
            select: { id: true, name: true }
        });

        // 3. Fallback: If not found and it's a subdomain of hrservices.me, try the prefix
        if (!company && cleanHost.endsWith('.hrservices.me')) {
            const subdomain = cleanHost.replace('.hrservices.me', '');
            company = await prisma.company.findUnique({
                where: { domain: subdomain },
                select: { id: true, name: true }
            });
        }

        if (company) {
            return NextResponse.json({ ...company, isAdmin: false });
        }

        return NextResponse.json(null);
    } catch (error) {
        console.error('Tenant resolution error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
