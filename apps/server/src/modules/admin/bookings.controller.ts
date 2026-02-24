import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';
import { checkWaitlistAndNotify } from '../waitlist/waitlist.controller.js';

// Local enum since Prisma client may not be generated
const BookingStatus = {
    pending_confirmation: 'pending_confirmation',
    confirmed: 'confirmed',
    deposit_pending: 'deposit_pending',
    deposit_paid: 'deposit_paid',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled_by_client: 'cancelled_by_client',
    cancelled_by_admin: 'cancelled_by_admin',
    no_show: 'no_show',
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

// Validation schemas
const bookingFiltersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.nativeEnum(BookingStatus).optional(),
    masterId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
});

const bookingStatusUpdateSchema = z.object({
    status: z.nativeEnum(BookingStatus),
    cancelReason: z.string().optional(),
    adminNotes: z.string().optional(),
});

export async function adminBookingsRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/bookings
     * Список всіх бронювань з фільтрами
     */
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = bookingFiltersSchema.safeParse(request.query);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { page, limit, status, masterId, userId, dateFrom, dateTo, search } = parseResult.data;

        const where: any = {};

        if (status) where.status = status;
        if (masterId) where.masterId = masterId;
        if (userId) where.userId = userId;
        if (dateFrom || dateTo) {
            where.bookingDate = {};
            if (dateFrom) where.bookingDate.gte = new Date(dateFrom);
            if (dateTo) where.bookingDate.lte = new Date(dateTo);
        }
        if (search) {
            where.OR = [
                { user: { telegramUsername: { contains: search } } },
                { user: { firstName: { contains: search } } },
                { user: { lastName: { contains: search } } },
            ];
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            telegramId: true,
                            telegramUsername: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                    master: {
                        select: {
                            id: true,
                            displayName: true,
                            photoUrl: true,
                        },
                    },
                    items: {
                        include: {
                            service: { select: { id: true, name: true } },
                            duration: { select: { id: true, durationMinutes: true } },
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                    promoCode: { select: { id: true, code: true } },
                },
                orderBy: { bookingDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.booking.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    });

    /**
     * GET /api/admin/bookings/:id
     * Деталі бронювання
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                master: {
                    select: {
                        id: true,
                        displayName: true,
                        photoUrl: true,
                        specialization: true,
                    },
                },
                items: {
                    include: {
                        service: true,
                        duration: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
                promoCode: true,
                review: true,
            },
        });

        if (!booking) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Booking not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { booking },
        });
    });

    /**
     * PATCH /api/admin/bookings/:id/status
     * Оновити статус бронювання
     */
    app.patch('/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = bookingStatusUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { status, cancelReason, adminNotes } = parseResult.data;

        const existing = await prisma.booking.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Booking not found', code: 'NOT_FOUND' },
            });
        }

        const updateData: any = { status };
        if (cancelReason) updateData.cancelReason = cancelReason;
        if (adminNotes) updateData.adminNotes = adminNotes;

        const booking = await prisma.booking.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                master: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
        });

        return reply.send({
            success: true,
            data: { booking },
        });
    });

    /**
     * DELETE /api/admin/bookings/:id
     * Скасувати бронювання
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { reason } = request.query as { reason?: string };

        const existing = await prisma.booking.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Booking not found', code: 'NOT_FOUND' },
            });
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                status: BookingStatus.cancelled_by_admin,
                cancelReason: reason || 'Cancelled by admin',
            },
            include: {
                items: {
                    include: {
                        service: true,
                    },
                },
            },
        });

        // Перевірити waitlist та відправити сповіщення
        if (booking.masterId && booking.items.length > 0) {
            const serviceId = booking.items[0]?.serviceId;
            if (serviceId) {
                checkWaitlistAndNotify(
                    booking.masterId,
                    serviceId,
                    booking.bookingDate,
                    booking.startTime,
                    booking.endTime
                ).catch(console.error);
            }
        }

        return reply.send({
            success: true,
            data: { booking, message: 'Booking cancelled successfully' },
        });
    });
}
