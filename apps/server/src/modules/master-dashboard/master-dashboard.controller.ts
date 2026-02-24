import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

// Types for dashboard
interface DashboardStats {
    todayBookings: number;
    weekBookings: number;
    monthBookings: number;
    todayIncome: number;
    weekIncome: number;
    monthIncome: number;
    totalClients: number;
    averageRating: number;
    reviewCount: number;
}

interface ScheduleDay {
    date: string;
    isDayOff: boolean;
    startTime: string | null;
    endTime: string | null;
    bookings: {
        id: string;
        startTime: string;
        endTime: string;
        status: string;
        serviceName: string;
        clientName: string;
        clientPhone: string;
        price: number;
    }[];
}

interface ClientInfo {
    id: string;
    name: string;
    phone: string;
    visitCount: number;
    totalSpent: number;
    lastVisit: string | null;
    averageRating: number | null;
}

// Schema for updating schedule
const updateScheduleSchema = z.object({
    workDate: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isDayOff: z.boolean().optional(),
});

// Schema for updating booking status
const updateBookingStatusSchema = z.object({
    status: z.enum(['completed', 'no_show']),
    notes: z.string().optional(),
});

// Helper function to get master ID from user
async function getMasterIdFromUser(userId: string): Promise<string | null> {
    const master = await prisma.master.findUnique({
        where: { userId },
        select: { id: true },
    });
    return master?.id || null;
}

// Helper function to calculate income
async function calculateIncome(masterId: string, startDate: Date, endDate: Date): Promise<number> {
    const bookings = await prisma.booking.findMany({
        where: {
            masterId,
            bookingDate: {
                gte: startDate,
                lte: endDate,
            },
            status: 'completed',
        },
        select: { totalPrice: true },
    });
    return bookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice), 0);
}

export async function masterDashboardRoutes(app: FastifyInstance) {
    // Apply auth middleware to all routes
    app.addHook('preHandler', requireAuth);

    /**
     * GET /api/master/dashboard
     * Статистика майстра
     */
    app.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;

        // Check if user is a master
        if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'owner') {
            return reply.status(403).send({
                success: false,
                error: { message: 'Access denied. Master role required.', code: 'FORBIDDEN' },
            });
        }

        const masterId = await getMasterIdFromUser(user.userId);
        if (!masterId) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master profile not found', code: 'NOT_FOUND' },
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get booking counts
        const [todayBookings, weekBookings, monthBookings, totalClients, reviews] = await Promise.all([
            prisma.booking.count({
                where: { masterId, bookingDate: today },
            }),
            prisma.booking.count({
                where: {
                    masterId,
                    bookingDate: { gte: weekStart, lte: today },
                },
            }),
            prisma.booking.count({
                where: {
                    masterId,
                    bookingDate: { gte: monthStart, lte: today },
                },
            }),
            prisma.booking.findMany({
                where: { masterId },
                select: { userId: true },
                distinct: ['userId'],
            }).then((bookings: any[]) => bookings.length),
            prisma.review.findMany({
                where: { masterId, status: 'approved' },
                select: { rating: true },
            }),
        ]);

        // Calculate income
        const [todayIncome, weekIncome, monthIncome] = await Promise.all([
            calculateIncome(masterId, today, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
            calculateIncome(masterId, weekStart, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
            calculateIncome(masterId, monthStart, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
        ]);

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
            : 0;

        const stats: DashboardStats = {
            todayBookings,
            weekBookings,
            monthBookings,
            todayIncome,
            weekIncome,
            monthIncome,
            totalClients,
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
        };

        return reply.send({
            success: true,
            data: { stats },
        });
    });

    /**
     * GET /api/master/schedule
     * Розклад на день/тиждень
     */
    app.get('/schedule', async (request: FastifyRequest<{
        Querystring: { startDate: string; endDate?: string }
    }>, reply: FastifyReply) => {
        const user = request.user;

        if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'owner') {
            return reply.status(403).send({
                success: false,
                error: { message: 'Access denied. Master role required.', code: 'FORBIDDEN' },
            });
        }

        const masterId = await getMasterIdFromUser(user.userId);
        if (!masterId) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master profile not found', code: 'NOT_FOUND' },
            });
        }

        const { startDate, endDate } = request.query;

        if (!startDate) {
            return reply.status(400).send({
                success: false,
                error: { message: 'startDate is required', code: 'VALIDATION_ERROR' },
            });
        }

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

        // Get schedules for the period
        const schedules = await prisma.masterSchedule.findMany({
            where: {
                masterId,
                workDate: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { workDate: 'asc' },
        });

        // Get bookings for the period
        const bookings = await prisma.booking.findMany({
            where: {
                masterId,
                bookingDate: {
                    gte: start,
                    lte: end,
                },
                status: {
                    notIn: ['cancelled_by_client', 'cancelled_by_admin'],
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        service: { select: { name: true } },
                    },
                },
            },
            orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
        });

        // Group bookings by date
        const bookingsByDate = bookings.reduce((acc: Record<string, typeof bookings>, booking: any) => {
            const dateKey = booking.bookingDate.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(booking);
            return acc;
        }, {} as Record<string, typeof bookings>);

        // Build schedule for each day in range
        const result: ScheduleDay[] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const schedule = schedules.find((s: any) =>
                s.workDate.toISOString().split('T')[0] === dateKey
            );
            const dayBookings = bookingsByDate[dateKey] || [];

            result.push({
                date: dateKey,
                isDayOff: schedule?.isDayOff || false,
                startTime: schedule?.startTime || null,
                endTime: schedule?.endTime || null,
                bookings: dayBookings.map((b: any) => ({
                    id: b.id,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    status: b.status,
                    serviceName: typeof b.items[0]?.service.name === 'object'
                        ? (b.items[0]?.service.name as Record<string, string>).uk || 'Послуга'
                        : 'Послуга',
                    clientName: [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || 'Клієнт',
                    clientPhone: b.user.phone || '',
                    price: Number(b.totalPrice),
                })),
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return reply.send({
            success: true,
            data: { schedule: result },
        });
    });

    /**
     * PUT /api/master/schedule
     * Встановити робочий час на день
     */
    app.put('/schedule', async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;

        if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'owner') {
            return reply.status(403).send({
                success: false,
                error: { message: 'Access denied. Master role required.', code: 'FORBIDDEN' },
            });
        }

        const masterId = await getMasterIdFromUser(user.userId);
        if (!masterId) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master profile not found', code: 'NOT_FOUND' },
            });
        }

        const parseResult = updateScheduleSchema.safeParse(request.body);

        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: parseResult.error.errors[0]?.message || 'Invalid data',
                    code: 'VALIDATION_ERROR',
                },
            });
        }

        const { workDate, startTime, endTime, isDayOff } = parseResult.data;

        const schedule = await prisma.masterSchedule.upsert({
            where: {
                masterId_workDate: {
                    masterId,
                    workDate: new Date(workDate),
                },
            },
            create: {
                masterId,
                workDate: new Date(workDate),
                startTime: startTime || '09:00',
                endTime: endTime || '18:00',
                isDayOff: isDayOff || false,
            },
            update: {
                startTime: startTime || '09:00',
                endTime: endTime || '18:00',
                isDayOff: isDayOff || false,
            },
        });

        return reply.send({
            success: true,
            data: { schedule },
        });
    });

    /**
     * PATCH /api/master/bookings/:id/status
     * Змінити статус бронювання
     */
    app.patch('/bookings/:id/status', async (request: FastifyRequest<{
        Params: { id: string };
    }>, reply: FastifyReply) => {
        const user = request.user;
        const { id: bookingId } = request.params;

        if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'owner') {
            return reply.status(403).send({
                success: false,
                error: { message: 'Access denied. Master role required.', code: 'FORBIDDEN' },
            });
        }

        const masterId = await getMasterIdFromUser(user.userId);
        if (!masterId) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master profile not found', code: 'NOT_FOUND' },
            });
        }

        // Verify booking belongs to this master
        const existingBooking = await prisma.booking.findFirst({
            where: { id: bookingId, masterId },
        });

        if (!existingBooking) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Booking not found', code: 'NOT_FOUND' },
            });
        }

        const parseResult = updateBookingStatusSchema.safeParse(request.body);

        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: parseResult.error.errors[0]?.message || 'Invalid data',
                    code: 'VALIDATION_ERROR',
                },
            });
        }

        const { status, notes } = parseResult.data;

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status,
                adminNotes: notes ? `${existingBooking.adminNotes || ''}\n${notes}` : existingBooking.adminNotes,
            },
            include: {
                user: { select: { firstName: true, lastName: true, telegramId: true } },
                master: { select: { displayName: true } },
                items: { include: { service: true } },
            },
        });

        // TODO: Send notification to client about status change

        return reply.send({
            success: true,
            data: { booking },
        });
    });

    /**
     * GET /api/master/clients
     * Список клієнтів майстра
     */
    app.get('/clients', async (request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; search?: string }
    }>, reply: FastifyReply) => {
        const user = request.user;

        if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'owner') {
            return reply.status(403).send({
                success: false,
                error: { message: 'Access denied. Master role required.', code: 'FORBIDDEN' },
            });
        }

        const masterId = await getMasterIdFromUser(user.userId);
        if (!masterId) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master profile not found', code: 'NOT_FOUND' },
            });
        }

        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '20');
        const search = request.query.search;

        // Get all bookings for this master to build client list
        const whereClause = search
            ? {
                masterId,
                user: {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' as const } },
                        { lastName: { contains: search, mode: 'insensitive' as const } },
                        { phone: { contains: search } },
                    ],
                },
            }
            : { masterId };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                    review: {
                        select: { rating: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.booking.count({ where: whereClause }),
        ]);

        // Group by client
        const clientsMap = new Map<string, {
            id: string;
            name: string;
            phone: string;
            visitCount: number;
            totalSpent: number;
            lastVisit: Date | null;
            ratings: number[];
        }>();

        for (const booking of bookings) {
            const clientId = booking.user.id;
            const existing = clientsMap.get(clientId);

            if (!existing) {
                clientsMap.set(clientId, {
                    id: clientId,
                    name: [booking.user.firstName, booking.user.lastName].filter(Boolean).join(' ') || 'Клієнт',
                    phone: booking.user.phone || '',
                    visitCount: 1,
                    totalSpent: booking.status === 'completed' ? Number(booking.totalPrice) : 0,
                    lastVisit: booking.bookingDate,
                    ratings: booking.review?.rating ? [booking.review.rating] : [],
                });
            } else {
                existing.visitCount += 1;
                if (booking.status === 'completed') {
                    existing.totalSpent += Number(booking.totalPrice);
                }
                if (booking.bookingDate > (existing.lastVisit || new Date(0))) {
                    existing.lastVisit = booking.bookingDate;
                }
                if (booking.review?.rating) {
                    existing.ratings.push(booking.review.rating);
                }
            }
        }

        // Convert to array and paginate
        const clients: ClientInfo[] = Array.from(clientsMap.values()).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            visitCount: c.visitCount,
            totalSpent: c.totalSpent,
            lastVisit: c.lastVisit?.toISOString() || null,
            averageRating: c.ratings.length > 0
                ? Math.round((c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length) * 10) / 10
                : null,
        }));

        const startIndex = (page - 1) * limit;
        const paginatedClients = clients.slice(startIndex, startIndex + limit);

        return reply.send({
            success: true,
            data: {
                clients: paginatedClients,
                pagination: {
                    page,
                    limit,
                    total: clients.length,
                    totalPages: Math.ceil(clients.length / limit),
                },
            },
        });
    });
}
