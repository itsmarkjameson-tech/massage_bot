import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { prisma } from '../../config/database.js';
import { sendNotification } from '../../services/notification.service.js';
import { format } from 'date-fns';

// Валідація тіла запиту додавання в waitlist
const addToWaitlistSchema = z.object({
    serviceId: z.string().uuid('Invalid service ID'),
    masterId: z.string().uuid('Invalid master ID').optional(),
    preferredDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    preferredStart: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
    preferredEnd: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
});

// Валідація параметрів бронювання
const bookSlotSchema = z.object({
    masterId: z.string().uuid('Invalid master ID'),
    bookingDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    startTime: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    serviceDurations: z.array(z.object({
        serviceId: z.string().uuid('Invalid service ID'),
        durationId: z.string().uuid('Invalid duration ID'),
    })).min(1, 'At least one service is required'),
});

export async function waitlistRoutes(app: FastifyInstance) {
    /**
     * POST /api/waitlist
     * Додати себе в список очікування
     */
    app.post<{
        Body: {
            serviceId: string;
            masterId?: string;
            preferredDate: string;
            preferredStart?: string;
            preferredEnd?: string;
        };
    }>(
        '/',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const { userId } = request.user;

            // Валідація вхідних даних
            const parseResult = addToWaitlistSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        message: parseResult.error.errors[0]?.message || 'Invalid data',
                        code: 'VALIDATION_ERROR',
                    },
                });
            }

            const { serviceId, masterId, preferredDate, preferredStart, preferredEnd } = parseResult.data;

            // Перевірка: чи вже є активний запис з такими критеріями
            const existingEntry = await prisma.waitlist.findFirst({
                where: {
                    userId,
                    serviceId,
                    masterId: masterId || null,
                    preferredDate: new Date(preferredDate),
                    status: {
                        in: ['active', 'notified'],
                    },
                },
            });

            if (existingEntry) {
                return reply.status(409).send({
                    success: false,
                    error: {
                        message: 'You already have an active waitlist entry for this criteria',
                        code: 'DUPLICATE_ENTRY',
                    },
                });
            }

            // Створення запису в waitlist
            const waitlistEntry = await prisma.waitlist.create({
                data: {
                    userId,
                    serviceId,
                    masterId: masterId || null,
                    preferredDate: new Date(preferredDate),
                    preferredStart: preferredStart || null,
                    preferredEnd: preferredEnd || null,
                    status: 'active',
                },
                include: {
                    service: {
                        select: { name: true },
                    },
                    master: {
                        select: { displayName: true },
                    },
                },
            });

            return reply.status(201).send({
                success: true,
                data: { waitlistEntry },
            });
        }
    );

    /**
     * GET /api/waitlist
     * Отримати свої записи в waitlist
     */
    app.get(
        '/',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const { userId } = request.user;

            const entries = await prisma.waitlist.findMany({
                where: { userId },
                include: {
                    service: {
                        select: { id: true, name: true, imageUrl: true },
                    },
                    master: {
                        select: { id: true, displayName: true, photoUrl: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return reply.send({
                success: true,
                data: { entries },
            });
        }
    );

    /**
     * DELETE /api/waitlist/:id
     * Видалити себе зі списку очікування
     */
    app.delete<{ Params: { id: string } }>(
        '/:id',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const { userId } = request.user;
            const { id } = request.params;

            // Знайти запис
            const entry = await prisma.waitlist.findUnique({
                where: { id },
            });

            if (!entry) {
                return reply.status(404).send({
                    success: false,
                    error: { message: 'Waitlist entry not found', code: 'NOT_FOUND' },
                });
            }

            // Перевірка власника
            if (entry.userId !== userId) {
                return reply.status(403).send({
                    success: false,
                    error: { message: 'Not authorized', code: 'FORBIDDEN' },
                });
            }

            // Видалення
            await prisma.waitlist.delete({
                where: { id },
            });

            return reply.send({
                success: true,
                data: { message: 'Removed from waitlist' },
            });
        }
    );

    /**
     * POST /api/waitlist/:id/book
     * Записатися на звільнившийся слот (коли статус = notified)
     */
    app.post<{
        Params: { id: string };
        Body: {
            masterId: string;
            bookingDate: string;
            startTime: string;
            serviceDurations: Array<{ serviceId: string; durationId: string }>;
        };
    }>(
        '/:id/book',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const { userId } = request.user;
            const { id } = request.params;

            // Валідація
            const parseResult = bookSlotSchema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        message: parseResult.error.errors[0]?.message || 'Invalid data',
                        code: 'VALIDATION_ERROR',
                    },
                });
            }

            const { masterId, bookingDate, startTime, serviceDurations } = parseResult.data;

            // Знайти запис в waitlist
            const waitlistEntry = await prisma.waitlist.findUnique({
                where: { id },
            });

            if (!waitlistEntry) {
                return reply.status(404).send({
                    success: false,
                    error: { message: 'Waitlist entry not found', code: 'NOT_FOUND' },
                });
            }

            if (waitlistEntry.userId !== userId) {
                return reply.status(403).send({
                    success: false,
                    error: { message: 'Not authorized', code: 'FORBIDDEN' },
                });
            }

            if (waitlistEntry.status !== 'notified') {
                return reply.status(400).send({
                    success: false,
                    error: {
                        message: 'You can only book when notified about availability',
                        code: 'INVALID_STATUS',
                    },
                });
            }

            // Перевірка слоту на доступність
            const bookingDateObj = new Date(bookingDate);
            const existingBookings = await prisma.booking.findMany({
                where: {
                    masterId,
                    bookingDate: bookingDateObj,
                    status: {
                        notIn: ['cancelled_by_client', 'cancelled_by_admin'],
                    },
                },
                select: { startTime: true, endTime: true },
            });

            // Проста перевірка (без генерації слотів)
            const isSlotAvailable = !existingBookings.some((booking: any) => {
                return (
                    (startTime >= booking.startTime && startTime < booking.endTime) ||
                    (booking.startTime >= startTime && booking.startTime < booking.endTime)
                );
            });

            if (!isSlotAvailable) {
                return reply.status(409).send({
                    success: false,
                    error: { message: 'Time slot is no longer available', code: 'SLOT_UNAVAILABLE' },
                });
            }

            // Розрахунок тривалості та ціни
            const itemsWithPrices = [];
            let totalDuration = 0;
            let totalPrice = 0;

            for (const item of serviceDurations) {
                const duration = await prisma.serviceDuration.findUnique({
                    where: { id: item.durationId },
                });
                if (duration) {
                    totalDuration += duration.durationMinutes;
                    const price = Number(duration.basePrice);
                    totalPrice += price;
                    itemsWithPrices.push({
                        serviceId: item.serviceId,
                        durationId: item.durationId,
                        price,
                        sortOrder: itemsWithPrices.length,
                    });
                }
            }

            // Розрахунок часу закінчення
            const [hours, minutes] = startTime.split(':').map(Number);
            const endDate = new Date(bookingDateObj);
            endDate.setHours(hours + Math.floor((minutes + totalDuration) / 60), (minutes + totalDuration) % 60);
            const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

            // Створення бронювання
            const booking = await prisma.booking.create({
                data: {
                    userId,
                    masterId,
                    bookingDate: bookingDateObj,
                    startTime,
                    endTime,
                    status: 'confirmed',
                    totalPrice,
                    items: {
                        create: itemsWithPrices,
                    },
                },
                include: {
                    items: {
                        include: {
                            service: true,
                            duration: true,
                        },
                    },
                    master: true,
                    user: true,
                },
            });

            // Оновлення статусу waitlist
            await prisma.waitlist.update({
                where: { id },
                data: { status: 'booked' },
            });

            // Отримати дані для повідомлення
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const service = await prisma.service.findUnique({ where: { id: serviceDurations[0]?.serviceId } });
            const master = await prisma.master.findUnique({ where: { id: masterId } });

            // Відправка підтвердження
            await sendNotification({
                userId,
                bookingId: booking.id,
                type: 'booking_confirmed',
                language: user?.language,
                params: {
                    master_name: (master?.displayName as any)?.uk || 'майстер',
                    date: format(bookingDateObj, 'dd.MM.yyyy'),
                    time: startTime,
                    service_name: (service?.name as any)?.uk || 'послуга',
                },
            });

            return reply.status(201).send({
                success: true,
                data: { booking },
            });
        }
    );
}

/**
 * Функція для перевірки waitlist та відправки сповіщень
 * Викликається при скасуванні бронювання
 */
export async function checkWaitlistAndNotify(
    masterId: string,
    serviceId: string,
    bookingDate: Date,
    startTime: string,
    endTime: string
): Promise<void> {
    // Знайти перший активний запис в waitlist
    const waitlistEntry = await prisma.waitlist.findFirst({
        where: {
            serviceId,
            OR: [
                { masterId: masterId },
                { masterId: null }
            ],
            status: 'active',
            preferredDate: {
                lte: bookingDate,
            },
        },
        include: {
            user: {
                select: { id: true, language: true, firstName: true },
            },
            service: {
                select: { name: true },
            },
            master: {
                select: { displayName: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    if (!waitlistEntry) {
        return;
    }

    // Оновити статус на notified
    await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: { status: 'notified' },
    });

    // Відправити сповіщення
    await sendNotification({
        userId: waitlistEntry.userId,
        type: 'waitlist_available',
        language: waitlistEntry.user.language,
        params: {
            service_name: (waitlistEntry.service?.name as any)?.uk || 'послуга',
            date: format(bookingDate, 'dd.MM.yyyy'),
            time: startTime,
            master_name: (waitlistEntry.master?.displayName as any)?.uk || 'майстер',
        },
    });
}
