import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/database.js';

export async function reviewsRoutes(app: FastifyInstance) {
    /**
     * GET /api/reviews
     * Список схвалених відгуків (для головної сторінки)
     */
    app.get('/', async (request: FastifyRequest<{
        Querystring: { limit?: string }
    }>, reply: FastifyReply) => {
        const limit = parseInt(request.query.limit ?? '10', 10);

        const reviews = await prisma.review.findMany({
            where: { status: 'approved' },
            include: {
                user: { select: { firstName: true, avatarUrl: true } },
                master: { select: { displayName: true, photoUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return reply.send({
            success: true,
            data: { reviews },
        });
    });
}
