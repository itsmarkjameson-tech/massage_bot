import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('👤 Adding SU user...');

    const user = await prisma.user.upsert({
        where: { telegramId: 597397363 },
        update: {
            role: UserRole.su,
            isActive: true,
        },
        create: {
            telegramId: 597397363,
            telegramUsername: 'su',
            firstName: 'Super',
            lastName: 'User',
            role: UserRole.su,
            language: 'uk',
            isActive: true,
        },
    });

    console.log('✅ SU user added/updated:', {
        id: user.id,
        telegramId: user.telegramId.toString(),
        role: user.role,
        isActive: user.isActive,
    });
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
