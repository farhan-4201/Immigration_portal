import prisma from './prisma';

export interface TenantInfo {
    id: string;
    name: string;
    isAdmin: boolean;
}

/**
 * Utility to identify the company based on the request domain
 */
export async function getCompanyByDomain(host: string | null): Promise<TenantInfo | null> {
    if (!host) return null;

    // Clean the host (remove port if present)
    const cleanHost = host.split(':')[0].toLowerCase();

    // 1. Check if it's the main admin domain or localhost
    if (
        cleanHost === 'localhost' ||
        cleanHost === 'hrservices.me' ||
        cleanHost === 'admin.westburylaw.co.uk' ||
        cleanHost === 'portal.westburylaw.co.uk'
    ) {
        return { id: 'admin', name: 'System Admin', isAdmin: true };
    }

    // 2. Lookup company by domain in DB
    // First try the full domain (e.g., company.com or company.hrservices.me)
    let company = await prisma.company.findUnique({
        where: { domain: cleanHost },
        select: { id: true, name: true }
    });

    // 3. Fallback: If not found and it's a subdomain of hrservices.me, try the prefix
    // (Allows user to just enter "tesla" as the domain instead of "tesla.hrservices.me")
    if (!company && cleanHost.endsWith('.hrservices.me')) {
        const subdomain = cleanHost.replace('.hrservices.me', '');
        company = await prisma.company.findUnique({
            where: { domain: subdomain },
            select: { id: true, name: true }
        });
    }

    return company ? { ...company, isAdmin: false } : null;
}

export function isMainDomain(host: string | null) {
    if (!host) return false;
    const cleanHost = host.split(':')[0].toLowerCase();
    return (
        cleanHost === 'localhost' ||
        cleanHost === 'hrservices.me' ||
        cleanHost === 'admin.westburylaw.co.uk' ||
        cleanHost === 'portal.westburylaw.co.uk'
    );
}
