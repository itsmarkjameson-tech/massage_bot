import { Worker, Job, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { sendNotification, scheduleNotification } from '../services/notification.service.js';
import { prisma } from '../config/database.js';
import { format, addHours, subHours } from 'date-fns';

/**
 * Отримати Redis з'єднання для воркерів
 */
function getRedisConnection(): ConnectionOptions {
    const redis = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
    return redis as unknown as ConnectionOptions;
}

const redisConnection = getRedisConnection();

/**
 * Інтерфейс для даних job
 */
interface NotificationJobData {
    type: string;
    userId: string;
    bookingId?: string;
    language?: string;
    params?: Record<string, string>;
}

/**
 * Воркер для обробки сповіщень
 */
export const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
        const { type, userId, bookingId, language, params } = job.data;

        console.log(`Processing notification job: ${job.id}, type: ${type}`);

        await sendNotification({
            type,
            userId,
            bookingId,
            language,
            params,
        });
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

/**
 * Воркер для обробки нагадувань
 */
export const reminderWorker = new Worker<NotificationJobData>(
    'reminders',
    async (job: Job<NotificationJobData>) => {
        const { type, userId, bookingId, params } = job.data;

        console.log(`Processing reminder job: ${job.id}, type: ${type}`);

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                master: { select: { displayName: true } },
                items: {
                    include: {
                        service: { select: { name: true } },
                    },
                },
            },
        });

        if (!booking) {
            console.log(`Booking not found: ${bookingId}`);
            return;
        }

        if (['cancelled_by_client', 'cancelled_by_admin', 'completed'].includes(booking.status)) {
            console.log(`Booking ${bookingId} is ${booking.status}, skipping reminder`);
            return;
        }

        await sendNotification({
            type,
            userId,
            bookingId,
            params,
        });
    },
    {
        connection: redisConnection,
        concurrency: 10,
    }
);

/**
 * Воркер для запитів відгуків
 */
export const reviewWorker = new Worker<NotificationJobData>(
    'reviews',
    async (job: Job<NotificationJobData>) => {
        const { userId, bookingId, params } = job.data;

        console.log(`Processing review request job: ${job.id}`);

        await sendNotification({
            type: 'review_request',
            userId,
            bookingId,
            params,
        });
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

/**
 * Обробити нагадування за 24 години
 */
export async function process24HourReminders(): Promise<number> {
    const targetTime = addHours(new Date(), 24);
    const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            bookingDate: {
                gte: new Date(targetTime.toDateString()),
                lt: new Date(new Date(targetTime.toDateString()).getTime() + 24 * 60 * 60 * 1000),
            },
            startTime: {
                gte: format(windowStart, 'HH:mm'),
                lte: format(windowEnd, 'HH:mm'),
            },
            status: {
                in: ['confirmed', 'deposit_paid'],
            },
        },
        include: {
            user: { select: { id: true, language: true, firstName: true } },
            master: { select: { displayName: true } },
            items: {
                include: { service: { select: { name: true } } },
            },
        },
    });

    let processed = 0;

    for (const booking of bookings) {
        const services = booking.items.map((item) => item.service.name).join(', ');

        await scheduleNotification(
            booking.user.id,
            'reminder_24h',
            new Date(),
            booking.id,
            {
                client_name: booking.user.firstName || '',
                master_name: (booking.master?.displayName as any)?.uk || '',
                service_name: services,
                date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                time: booking.startTime,
            }
        );

        await sendNotification({
            type: 'reminder_24h',
            userId: booking.user.id,
            bookingId: booking.id,
            language: booking.user.language,
            params: {
                client_name: booking.user.firstName || '',
                master_name: (booking.master?.displayName as any)?.uk || '',
                service_name: services,
                date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                time: booking.startTime,
            },
        });

        processed++;
    }

    console.log(`Processed ${processed} 24h reminders`);
    return processed;
}

/**
 * Обробити нагадування за 2 години
 */
export async function process2HourReminders(): Promise<number> {
    const targetTime = addHours(new Date(), 2);
    const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            bookingDate: {
                gte: new Date(targetTime.toDateString()),
                lt: new Date(new Date(targetTime.toDateString()).getTime() + 24 * 60 * 60 * 1000),
            },
            startTime: {
                gte: format(windowStart, 'HH:mm'),
                lte: format(windowEnd, 'HH:mm'),
            },
            status: {
                in: ['confirmed', 'deposit_paid'],
            },
        },
        include: {
            user: { select: { id: true, language: true, firstName: true } },
            master: { select: { displayName: true } },
            items: {
                include: { service: { select: { name: true } } },
            },
        },
    });

    let processed = 0;

    for (const booking of bookings) {
        const services = booking.items.map((item) => item.service.name).join(', ');

        await sendNotification({
            type: 'reminder_2h',
            userId: booking.user.id,
            bookingId: booking.id,
            language: booking.user.language,
            params: {
                client_name: booking.user.firstName || '',
                master_name: (booking.master?.displayName as any)?.uk || '',
                service_name: services,
                date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                time: booking.startTime,
            },
        });

        processed++;
    }

    console.log(`Processed ${processed} 2h reminders`);
    return processed;
}

/**
 * Обробити запити відгуків
 */
export async function processReviewRequests(): Promise<number> {
    const twoHoursAgo = subHours(new Date(), 2);
    const windowStart = new Date(twoHoursAgo.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(twoHoursAgo.getTime() + 15 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            bookingDate: {
                gte: new Date(windowStart.toDateString()),
                lt: new Date(new Date(windowStart.toDateString()).getTime() + 24 * 60 * 60 * 1000),
            },
            endTime: {
                gte: format(windowStart, 'HH:mm'),
                lte: format(windowEnd, 'HH:mm'),
            },
            status: 'completed',
            review: null,
        },
        include: {
            user: { select: { id: true, language: true, firstName: true } },
            master: { select: { displayName: true } },
        },
    });

    let processed = 0;

    for (const booking of bookings) {
        await sendNotification({
            type: 'review_request',
            userId: booking.user.id,
            bookingId: booking.id,
            language: booking.user.language,
            params: {
                client_name: booking.user.firstName || '',
                master_name: (booking.master?.displayName as any)?.uk || '',
                date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
            },
        });

        processed++;
    }

    console.log(`Processed ${processed} review requests`);
    return processed;
}

/**
 * Закрити всі воркери
 */
export async function closeWorkers() {
    await notificationWorker.close();
    await reminderWorker.close();
    await reviewWorker.close();
    console.log('✅ All workers closed');
}
