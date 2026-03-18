const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    const prisma = new PrismaClient();
    
    console.log('Starting seed...');
    
    // Create Default Admin
    const adminEmail = 'admin@westburylaw.co.uk';
    const hashedPassword = await bcrypt.hash('Admin@2026', 12);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'System Administrator',
            password: hashedPassword,
            role: 'Admin',
            status: 'Active',
        },
    });

    console.log(`✅ Admin account ensured: ${admin.email}`);

    // Create a demo company
    const company = await prisma.company.upsert({
        where: { name: 'Demo Company' },
        update: {},
        create: {
            name: 'Demo Company',
            domain: 'demo.localhost',
            licenseNumber: 'L123456',
        }
    });

    console.log(`✅ Demo company ensured: ${company.name}`);

    // Create a demo portal user
    const portalUserEmail = 'user@demo.com';
    const portalHashedPassword = await bcrypt.hash('User@2026', 12);
    
    await prisma.user.upsert({
        where: { email: portalUserEmail },
        update: {},
        create: {
            email: portalUserEmail,
            name: 'Demo Portal User',
            password: portalHashedPassword,
            role: 'CompanyPortal',
            status: 'Active',
            companyId: company.id
        }
    });

    console.log(`✅ Demo portal user ensured: ${portalUserEmail}`);

    await prisma.$disconnect();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
