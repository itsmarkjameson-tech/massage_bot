import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';

// Валідація параметрів запиту
const availableQuerySchema = z.object({
    serviceId: z.string().uuid('Invalid service ID'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
});

export async function mastersRoutes(app: FastifyInstance) {
    /**
     * GET /api/masters
     * Список всіх активних майстрів
     */
    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const masters = await prisma.master.findMany({
            where: { isActive: true },
            include: {
                masterServices: {
                    include: { service: { select: { id: true, name: true } } },
                },
                reviews: {
                    where: { status: 'approved' },
                    select: { rating: true },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        // Calculate average rating for each master
        const mastersWithRating = masters.map((master) => {
            const ratings = master.reviews.map((r) => r.rating);
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0;

            return {
                id: master.id,
                displayName: master.displayName,
                bio: master.bio,
                photoUrl: master.photoUrl,
                specialization: master.specialization,
                services: master.masterServices.map((ms) => ms.service),
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: ratings.length,
            };
        });

        return reply.send({
            success: true,
            data: { masters: mastersWithRating },
        });
    });

    /**
     * GET /api/masters/:id
     * Профіль майстра
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const master = await prisma.master.findUnique({
            where: { id, isActive: true },
            include: {
                masterServices: {
                    include: {
                        service: {
                            include: {
                                durations: { where: { isActive: true } },
                            },
                        },
                    },
                },
                reviews: {
                    where: { status: 'approved' },
                    include: {
                        user: { select: { firstName: true, avatarUrl: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!master) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { master },
        });
    });

    /**
     * GET /api/masters/available
     * Вільні майстри для конкретної послуги
     */
    app.get('/available', async (request: FastifyRequest<{
        Querystring: { serviceId: string; date?: string }
    }>, reply: FastifyReply) => {
        const parseResult = availableQuerySchema.safeParse(request.query);

        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: parseResult.error.errors[0]?.message || 'Invalid query parameters',
                    code: 'VALIDATION_ERROR',
                },
            });
        }

        const { serviceId, date } = parseResult.data;

        const masters = await prisma.master.findMany({
            where: {
                isActive: true,
                masterServices: {
                    some: { serviceId },
                },
                ...(date && {
                    schedules: {
                        some: {
                            workDate: new Date(date),
                            isDayOff: false,
                        },
                    },
                }),
            },
            include: {
                masterServices: true,
                reviews: {
                    where: { status: 'approved' },
                    select: { rating: true },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        // Calculate average rating for each master
        const mastersWithRating = masters.map((master) => {
            const ratings = master.reviews.map((r) => r.rating);
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0;

            return {
                id: master.id,
                displayName: master.displayName,
                bio: master.bio,
                photoUrl: master.photoUrl,
                specialization: master.specialization,
                isActive: master.isActive,
                sortOrder: master.sortOrder,
                masterServices: master.masterServices,
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: ratings.length,
            };
        });

        return reply.send({
            success: true,
            data: { masters: mastersWithRating },
        });
    });
}
