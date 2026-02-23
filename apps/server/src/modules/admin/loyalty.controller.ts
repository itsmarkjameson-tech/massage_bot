import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Validation schemas
const loyaltySettingsUpdateSchema = z.object({
    stampsForReward: z.number().int().positive(),
    eligibleServices: z.array(z.string().uuid()).optional(),
    isActive: z.boolean().optional(),
});

export async function adminLoyaltyRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/loyalty/settings
     * Отримати налаштування лояльності
     */
    app.get('/settings', async (_request: FastifyRequest, reply: FastifyReply) => {
        let settings = await prisma.loyaltySettings.findFirst();

        if (!settings) {
            // Create default settings if not exists
            settings = await prisma.loyaltySettings.create({
                data: {
                    stampsForReward: 10,
                    isActive: true,
                },
            });
        }

        return reply.send({
            success: true,
            data: { settings },
        });
    });

    /**
     * PUT /api/admin/loyalty/settings
     * Оновити налаштування лояльності
     */
    app.put('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = loyaltySettingsUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const data = parseResult.data;

        let settings = await prisma.loyaltySettings.findFirst();

        if (!settings) {
            settings = await prisma.loyaltySettings.create({
                data,
            });
        } else {
            settings = await prisma.loyaltySettings.update({
                where: { id: settings.id },
                data,
            });
        }

        return reply.send({
            success: true,
            data: { settings },
        });
    });

    /**
     * GET /api/admin/loyalty/stamps
     * Отримати всі stamps (для адміна)
     */
    app.get('/stamps', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; userId?: string } }>, reply: FastifyReply) => {
        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '20');
        const { userId } = request.query;

        const where: any = {};
        if (userId) where.userId = userId;

        const [stamps, total] = await Promise.all([
            prisma.loyaltyStamp.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            telegramUsername: true,
                            firstName: true,
                            lastName: true,
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
            prisma.loyaltyStamp.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                stamps,
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
     * GET /api/admin/loyalty/users
     * Отримати користувачів з їх stamps
     */
    app.get('/users', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '20');

        const users = await prisma.user.findMany({
            where: {
                loyaltyStamps: {
                    some: {},
                },
            },
            select: {
                id: true,
                telegramUsername: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                loyaltyStamps: {
                    select: {
                        id: true,
                        stampNumber: true,
                        isReward: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Calculate total stamps for each user
        const usersWithStamps = users.map((user) => {
            const totalStamps = user.loyaltyStamps.filter((s) => !s.isReward).length;
            const rewards = user.loyaltyStamps.filter((s) => s.isReward).length;
            return {
                ...user,
                totalStamps,
                rewards,
            };
        });

        return reply.send({
            success: true,
            data: { users: usersWithStamps },
        });
    });
}
