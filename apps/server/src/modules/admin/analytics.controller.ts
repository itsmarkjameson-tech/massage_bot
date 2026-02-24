import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Local type since Prisma client may not be generated
export type BookingStatus =
    | 'pending_confirmation'
    | 'confirmed'
    | 'deposit_pending'
    | 'deposit_paid'
    | 'in_progress'
    | 'completed'
    | 'cancelled_by_client'
    | 'cancelled_by_admin'
    | 'no_show';

const dateRangeSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export async function adminAnalyticsRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/analytics/overview
     * Загальна статистика
     */
    app.get('/overview', async (_request: FastifyRequest, reply: FastifyReply) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        // Get counts
        const [
            totalUsers,
            totalMasters,
            totalServices,
            totalBookings,
            todayBookings,
            pendingBookings,
            completedBookings,
            totalRevenue,
            thisMonthRevenue,
            lastMonthRevenue,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.master.count({ where: { isActive: true } }),
            prisma.service.count({ where: { isActive: true } }),
            prisma.booking.count(),
            prisma.booking.count({
                where: {
                    bookingDate: { gte: today },
                },
            }),
            prisma.booking.count({
                where: { status: BookingStatus.pending_confirmation },
            }),
            prisma.booking.count({
                where: { status: BookingStatus.completed },
            }),
            prisma.booking.aggregate({
                where: { status: BookingStatus.completed },
                _sum: { totalPrice: true },
            }),
            prisma.booking.aggregate({
                where: {
                    status: BookingStatus.completed,
                    bookingDate: { gte: startOfMonth },
                },
                _sum: { totalPrice: true },
            }),
            prisma.booking.aggregate({
                where: {
                    status: BookingStatus.completed,
                    bookingDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { totalPrice: true },
            }),
        ]);

        // Calculate average booking value
        const avgBookingValue = completedBookings > 0
            ? Number(totalRevenue._sum.totalPrice || 0) / completedBookings
            : 0;

        // Calculate month growth
        const lastMonthValue = Number(lastMonthRevenue._sum.totalPrice || 0);
        const thisMonthValue = Number(thisMonthRevenue._sum.totalPrice || 0);
        const monthGrowth = lastMonthValue > 0
            ? ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100
            : 0;

        return reply.send({
            success: true,
            data: {
                totalUsers,
                totalMasters,
                totalServices,
                totalBookings,
                todayBookings,
                pendingBookings,
                completedBookings,
                totalRevenue: totalRevenue._sum.totalPrice || 0,
                thisMonthRevenue: thisMonthRevenue._sum.totalPrice || 0,
                avgBookingValue,
                monthGrowth: Math.round(monthGrowth * 10) / 10,
            },
        });
    });

    /**
     * GET /api/admin/analytics/revenue
     * Статистика доходу
     */
    app.get('/revenue', async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
        const { startDate, endDate } = request.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();

        const bookings = await prisma.booking.findMany({
            where: {
                status: BookingStatus.completed,
                bookingDate: { gte: start, lte: end },
            },
            select: {
                bookingDate: true,
                totalPrice: true,
                discountAmount: true,
            },
            orderBy: { bookingDate: 'asc' },
        });

        // Group by day
        const dailyRevenue: Record<string, number> = {};
        let totalRevenue = 0;
        let totalDiscount = 0;

        bookings.forEach((booking) => {
            const date = booking.bookingDate.toISOString().split('T')[0];
            const revenue = Number(booking.totalPrice);
            dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
            totalRevenue += revenue;
            totalDiscount += Number(booking.discountAmount);
        });

        const revenueByDay = Object.entries(dailyRevenue).map(([date, revenue]) => ({
            date,
            revenue,
        }));

        return reply.send({
            success: true,
            data: {
                totalRevenue,
                totalDiscount,
                revenueByDay,
                period: { start, end },
            },
        });
    });

    /**
     * GET /api/admin/analytics/bookings
     * Статистика бронювань
     */
    app.get('/bookings', async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
        const { startDate, endDate } = request.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();

        // Get bookings by status
        const statusCounts = await prisma.booking.groupBy({
            by: ['status'],
            where: {
                bookingDate: { gte: start, lte: end },
            },
            _count: true,
        });

        // Get bookings by master
        const masterCounts = await prisma.booking.groupBy({
            by: ['masterId'],
            where: {
                bookingDate: { gte: start, lte: end },
                masterId: { not: null },
            },
            _count: true,
        });

        const masters = await prisma.master.findMany({
            where: { id: { in: masterCounts.map((m) => m.masterId!) } },
            select: { id: true, displayName: true },
        });

        const masterData = masterCounts.map((m) => ({
            masterId: m.masterId,
            masterName: masters.find((master) => master.id === m.masterId)?.displayName || 'Unknown',
            count: m._count,
        }));

        // Get daily bookings
        const bookings = await prisma.booking.findMany({
            where: {
                bookingDate: { gte: start, lte: end },
            },
            select: { bookingDate: true },
            orderBy: { bookingDate: 'asc' },
        });

        const dailyBookings: Record<string, number> = {};
        bookings.forEach((booking) => {
            const date = booking.bookingDate.toISOString().split('T')[0];
            dailyBookings[date] = (dailyBookings[date] || 0) + 1;
        });

        const bookingsByDay = Object.entries(dailyBookings).map(([date, count]) => ({
            date,
            count,
        }));

        return reply.send({
            success: true,
            data: {
                byStatus: statusCounts.map((s) => ({
                    status: s.status,
                    count: s._count,
                })),
                byMaster: masterData,
                byDay: bookingsByDay,
                period: { start, end },
            },
        });
    });

    /**
     * GET /api/admin/analytics/services
     * Найпопулярніші послуги
     */
    app.get('/services', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
        const limit = parseInt(request.query.limit || '10');

        const serviceCounts = await prisma.bookingItem.groupBy({
            by: ['serviceId'],
            where: {
                booking: {
                    status: BookingStatus.completed,
                },
            },
            _count: true,
            _sum: { price: true },
        });

        const services = await prisma.service.findMany({
            where: { id: { in: serviceCounts.map((s) => s.serviceId) } },
            select: { id: true, name: true },
        });

        const result = serviceCounts
            .map((s) => ({
                serviceId: s.serviceId,
                serviceName: services.find((service) => service.id === s.serviceId)?.name || 'Unknown',
                bookingsCount: s._count,
                totalRevenue: s._sum.price || 0,
            }))
            .sort((a, b) => b.bookingsCount - a.bookingsCount)
            .slice(0, limit);

        return reply.send({
            success: true,
            data: { services: result },
        });
    });

    /**
     * GET /api/admin/analytics/masters
     * Статистика майстрів
     */
    app.get('/masters', async (_request: FastifyRequest, reply: FastifyReply) => {
        const masters = await prisma.master.findMany({
            where: { isActive: true },
            include: {
                bookings: {
                    where: { status: BookingStatus.completed },
                    select: { totalPrice: true },
                },
                reviews: {
                    where: { status: 'approved' },
                    select: { rating: true },
                },
            },
        });

        const result = masters.map((master) => {
            const totalRevenue = master.bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
            const ratings = master.reviews.map((r) => r.rating);
            const avgRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            return {
                masterId: master.id,
                displayName: master.displayName,
                photoUrl: master.photoUrl,
                totalBookings: master.bookings.length,
                totalRevenue,
                avgRating: Math.round(avgRating * 10) / 10,
                reviewCount: ratings.length,
            };
        });

        return reply.send({
            success: true,
            data: { masters: result },
        });
    });
}
