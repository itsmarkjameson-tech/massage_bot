import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/database.js';

export async function promotionsRoutes(app: FastifyInstance) {
    /**
     * GET /api/promotions
     * Список активних акцій
     */
    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const now = new Date();

        const promotions = await prisma.promotion.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return reply.send({
            success: true,
            data: { promotions },
        });
    });

    /**
     * GET /api/promotions/:id
     * Деталі акції
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const promotion = await prisma.promotion.findUnique({
            where: { id },
        });

        if (!promotion) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Promotion not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { promotion },
        });
    });
}
