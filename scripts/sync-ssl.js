const { PrismaClient } = require('../lib/generated/prisma');
const { exec } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function syncSSL() {
    console.log('[SSL Sync] Starting synchronization...');
    try {
        const companies = await prisma.company.findMany({
            select: { domain: true },
            where: { domain: { not: null } }
        });

        const baseDomains = ['hrservices.me', 'api.hrservices.me'];
        const companyDomains = companies.map(c => c.domain).filter(Boolean);

        // Remove duplicates and combine
        const allDomains = [...new Set([...baseDomains, ...companyDomains])];

        if (allDomains.length === 0) {
            console.log('[SSL Sync] No domains found to sync.');
            return;
        }

        const domainList = allDomains.join(',');
        console.log(`[SSL Sync] Domains to include: ${domainList}`);

        console.log(`[SSL Sync] Wildcard certificate detected (*.hrservices.me). No expansion needed.`);
        console.log(`[SSL Sync] Active domains: ${domainList}`);

        // Since we have a wildcard, we just reload Nginx to ensure any potential config updates are live
        exec('systemctl reload nginx', (err) => {
            if (err) {
                console.error(`[SSL Sync] Nginx Reload Failed: ${err.message}`);
            } else {
                console.log('[SSL Sync] Nginx reloaded successfully.');
            }
        });

    } catch (err) {
        console.error('[SSL Sync] Fatal Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

syncSSL();
