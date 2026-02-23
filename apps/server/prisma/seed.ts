import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create site settings
    const settings = [
        { key: 'salon_name', value: { uk: 'Масажний салон', en: 'Massage Salon', ru: 'Массажный салон' } },
        { key: 'salon_address', value: { uk: 'м. Київ, вул. Хрещатик, 1', en: 'Kyiv, Khreshchatyk St, 1', ru: 'г. Киев, ул. Крещатик, 1' } },
        { key: 'salon_phone', value: '+380501234567' },
        { key: 'google_maps_lat', value: 50.4501 },
        { key: 'google_maps_lng', value: 30.5234 },
        { key: 'deposit_percent', value: 50 },
        { key: 'buffer_minutes', value: 15 },
        { key: 'cancel_hours_before', value: 2 },
        { key: 'booking_days_ahead', value: 14 },
        {
            key: 'about_text', value: {
                uk: 'Ми — команда професійних масажистів, які допоможуть вам відновити сили та знайти гармонію тіла і душі. Наш салон працює з 2020 року і за цей час ми допомогли тисячам клієнтів.',
                en: 'We are a team of professional massage therapists who will help you restore your energy and find harmony of body and soul. Our salon has been operating since 2020.',
                ru: 'Мы — команда профессиональных массажистов, которые помогут вам восстановить силы и обрести гармонию тела и души. Наш салон работает с 2020 года.'
            }
        },
    ];

    for (const setting of settings) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value as any },
            create: { key: setting.key, value: setting.value as any },
        });
    }

    // Create service categories
    const bodyCategory = await prisma.serviceCategory.create({
        data: {
            name: { uk: 'Масаж тіла', en: 'Body Massage', ru: 'Массаж тела' },
            description: { uk: 'Класичні та спеціальні масажі тіла', en: 'Classic and special body massages', ru: 'Классические и специальные массажи тела' },
            sortOrder: 1,
        },
    });

    const faceCategory = await prisma.serviceCategory.create({
        data: {
            name: { uk: 'Масаж обличчя', en: 'Face Massage', ru: 'Массаж лица' },
            description: { uk: 'Омолоджуючі та розслаблюючі масажі обличчя', en: 'Rejuvenating and relaxing face massages', ru: 'Омолаживающие и расслабляющие массажи лица' },
            sortOrder: 2,
        },
    });

    const spaCategory = await prisma.serviceCategory.create({
        data: {
            name: { uk: 'SPA-програми', en: 'SPA Programs', ru: 'SPA-программы' },
            description: { uk: 'Комплексні SPA-програми для повного відновлення', en: 'Comprehensive SPA programs for full recovery', ru: 'Комплексные SPA-программы для полного восстановления' },
            sortOrder: 3,
        },
    });

    // Create services with durations
    const services = [
        {
            categoryId: bodyCategory.id,
            name: { uk: 'Класичний масаж', en: 'Classic Massage', ru: 'Классический массаж' },
            description: { uk: 'Традиційний масаж для зняття напруги та покращення кровообігу', en: 'Traditional massage to relieve tension and improve circulation', ru: 'Традиционный массаж для снятия напряжения и улучшения кровообращения' },
            durations: [
                { durationMinutes: 30, basePrice: 500 },
                { durationMinutes: 60, basePrice: 900 },
                { durationMinutes: 90, basePrice: 1200 },
            ],
            sortOrder: 1,
        },
        {
            categoryId: bodyCategory.id,
            name: { uk: 'Спортивний масаж', en: 'Sports Massage', ru: 'Спортивный массаж' },
            description: { uk: 'Інтенсивний масаж для спортсменів та активних людей', en: 'Intensive massage for athletes and active people', ru: 'Интенсивный массаж для спортсменов и активных людей' },
            durations: [
                { durationMinutes: 30, basePrice: 600 },
                { durationMinutes: 60, basePrice: 1000 },
                { durationMinutes: 90, basePrice: 1400 },
            ],
            sortOrder: 2,
        },
        {
            categoryId: bodyCategory.id,
            name: { uk: 'Антицелюлітний масаж', en: 'Anti-cellulite Massage', ru: 'Антицеллюлитный массаж' },
            description: { uk: 'Масаж для боротьби з целюлітом та покращення тонусу шкіри', en: 'Massage to fight cellulite and improve skin tone', ru: 'Массаж для борьбы с целлюлитом и улучшения тонуса кожи' },
            durations: [
                { durationMinutes: 30, basePrice: 550 },
                { durationMinutes: 60, basePrice: 950 },
            ],
            sortOrder: 3,
        },
        {
            categoryId: faceCategory.id,
            name: { uk: 'Масаж обличчя класичний', en: 'Classic Face Massage', ru: 'Классический массаж лица' },
            description: { uk: 'Розслаблюючий масаж обличчя з використанням натуральних олій', en: 'Relaxing face massage using natural oils', ru: 'Расслабляющий массаж лица с использованием натуральных масел' },
            durations: [
                { durationMinutes: 30, basePrice: 400 },
                { durationMinutes: 60, basePrice: 700 },
            ],
            sortOrder: 1,
        },
        {
            categoryId: spaCategory.id,
            name: { uk: 'SPA Релакс', en: 'SPA Relax', ru: 'SPA Релакс' },
            description: { uk: 'Комплексна програма: масаж тіла + масаж обличчя + ароматерапія', en: 'Complex program: body massage + face massage + aromatherapy', ru: 'Комплексная программа: массаж тела + массаж лица + ароматерапия' },
            durations: [
                { durationMinutes: 90, basePrice: 1800 },
            ],
            sortOrder: 1,
            requiresConfirmation: true,
        },
    ];

    for (const serviceData of services) {
        const { durations, ...data } = serviceData;
        const service = await prisma.service.create({
            data: {
                ...data,
                name: data.name as any,
                description: data.description as any,
            },
        });

        for (const duration of durations) {
            await prisma.serviceDuration.create({
                data: {
                    serviceId: service.id,
                    ...duration,
                },
            });
        }
    }

    // Create loyalty settings
    await prisma.loyaltySettings.create({
        data: {
            stampsForReward: 10,
            isActive: true,
        },
    });

    // Create sample users and masters
    const masterUsers = [
        {
            telegramId: 111111111,
            name: 'Олена',
            bio: { uk: 'Професійний масажист з 5-річним досвідом', en: 'Professional massage therapist with 5 years experience', ru: 'Профессиональный массажист с 5-летним опытом' },
            photoUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400',
            isActive: true,
            sortOrder: 1,
        },
        {
            telegramId: 222222222,
            name: 'Андрій',
            bio: { uk: 'Спортивний масаж та реабілітація', en: 'Sports massage and rehabilitation', ru: 'Спортивный массаж и реабилитация' },
            photoUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400',
            isActive: true,
            sortOrder: 2,
        },
        {
            telegramId: 333333333,
            name: 'Марія',
            bio: { uk: 'Масаж обличчя та SPA процедури', en: 'Face massage and SPA procedures', ru: 'Массаж лица и SPA процедуры' },
            photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
            isActive: true,
            sortOrder: 3,
        },
    ];

    for (const masterData of masterUsers) {
        const user = await prisma.user.create({
            data: {
                telegramId: masterData.telegramId,
                role: 'master',
                language: 'uk',
            },
        });

        await prisma.master.create({
            data: {
                userId: user.id,
                displayName: { uk: masterData.name, en: masterData.name, ru: masterData.name },
                bio: masterData.bio,
                photoUrl: masterData.photoUrl,
                isActive: masterData.isActive,
                sortOrder: masterData.sortOrder,
            },
        });
    }

    // Create sample promotion
    await prisma.promotion.create({
        data: {
            title: { uk: 'Знижка 20% на перший візит!', en: '20% off your first visit!', ru: 'Скидка 20% на первый визит!' },
            description: { uk: 'Запишіться вперше та отримайте знижку 20% на будь-яку послугу', en: 'Book for the first time and get 20% off any service', ru: 'Запишитесь впервые и получите скидку 20% на любую услугу' },
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            isActive: true,
            sortOrder: 1,
        },
    });

    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
