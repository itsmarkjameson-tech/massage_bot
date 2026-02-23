import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/database.js';

export async function servicesRoutes(app: FastifyInstance) {
    /**
     * GET /api/services
     * Список всіх активних послуг з категоріями та тривалостями
     */
    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const services = await prisma.service.findMany({
            where: { isActive: true },
            include: {
                category: true,
                durations: {
                    where: { isActive: true },
                    orderBy: { durationMinutes: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return reply.send({
            success: true,
            data: { services },
        });
    });

    /**
     * GET /api/services/categories
     * Дерево категорій
     */
    app.get('/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
        const categories = await prisma.serviceCategory.findMany({
            where: { isActive: true, parentId: null },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return reply.send({
            success: true,
            data: { categories },
        });
    });

    /**
     * GET /api/services/:id
     * Деталі послуги
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const service = await prisma.service.findUnique({
            where: { id, isActive: true },
            include: {
                category: true,
                durations: {
                    where: { isActive: true },
                    orderBy: { durationMinutes: 'asc' },
                },
                masterServices: {
                    include: {
                        master: {
                            select: {
                                id: true,
                                displayName: true,
                                photoUrl: true,
                                specialization: true,
                            },
                        },
                    },
                },
            },
        });

        if (!service) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Service not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { service },
        });
    });
}
