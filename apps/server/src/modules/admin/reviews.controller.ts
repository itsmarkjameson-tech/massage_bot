import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Local enum since Prisma client may not be generated
const ReviewStatus = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
} as const;

export type ReviewStatus = typeof ReviewStatus[keyof typeof ReviewStatus];

// Validation schemas
const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

const reviewStatusUpdateSchema = z.object({
    status: z.nativeEnum(ReviewStatus),
});

export async function adminReviewsRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/reviews
     * Список всіх відгуків з пагінацією
     */
    app.get('/', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; status?: string; masterId?: string; rating?: string } }>, reply: FastifyReply) => {
        const parseResult = paginationSchema.safeParse(request.query);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { page, limit } = parseResult.data;
        const { status, masterId, rating } = request.query;

        const where: any = {};

        if (status) where.status = status;
        if (masterId) where.masterId = masterId;
        if (rating) where.rating = parseInt(rating);

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            telegramUsername: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    master: {
                        select: {
                            id: true,
                            displayName: true,
                            photoUrl: true,
                        },
                    },
                    booking: {
                        select: {
                            id: true,
                            bookingDate: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                reviews,
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
     * GET /api/admin/reviews/:id
     * Деталі відгуку
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                master: {
                    select: {
                        id: true,
                        displayName: true,
                        photoUrl: true,
                    },
                },
                booking: true,
            },
        });

        if (!review) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Review not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { review },
        });
    });

    /**
     * PATCH /api/admin/reviews/:id/status
     * Оновити статус відгуку (approve/reject)
     */
    app.patch('/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = reviewStatusUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { status } = parseResult.data;

        const existing = await prisma.review.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Review not found', code: 'NOT_FOUND' },
            });
        }

        const review = await prisma.review.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
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
            data: { review },
        });
    });

    /**
     * DELETE /api/admin/reviews/:id
     * Видалити відгук
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.review.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Review not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.review.delete({
            where: { id },
        });

        return reply.send({
            success: true,
            data: { message: 'Review deleted successfully' },
        });
    });

    /**
     * GET /api/admin/reviews/stats
     * Статистика відгуків
     */
    app.get('/stats/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
        const [total, pending, approved, rejected, avgRating] = await Promise.all([
            prisma.review.count(),
            prisma.review.count({ where: { status: ReviewStatus.pending } }),
            prisma.review.count({ where: { status: ReviewStatus.approved } }),
            prisma.review.count({ where: { status: ReviewStatus.rejected } }),
            prisma.review.aggregate({
                where: { status: ReviewStatus.approved },
                _avg: { rating: true },
            }),
        ]);

        return reply.send({
            success: true,
            data: {
                total,
                pending,
                approved,
                rejected,
                avgRating: avgRating._avg.rating || 0,
            },
        });
    });
}
