import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { prisma } from '../../config/database.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
    language: z.enum(['uk', 'en', 'ru']).optional(),
});

export async function profileRoutes(app: FastifyInstance) {
    /**
     * GET /api/profile
     * Отримати профіль поточного користувача
     */
    app.get('/', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                telegramId: true,
                telegramUsername: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                role: true,
                language: true,
                createdAt: true,
            },
        });

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: { message: 'User not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: {
                user: {
                    ...user,
                    telegramId: Number(user.telegramId),
                },
            },
        });
    });

    /**
     * PUT /api/profile
     * Оновити профіль
     */
    app.put('/', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;
        const data = updateProfileSchema.parse(request.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                telegramId: true,
                telegramUsername: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                role: true,
                language: true,
            },
        });

        return reply.send({
            success: true,
            data: {
                user: {
                    ...user,
                    telegramId: Number(user.telegramId),
                },
            },
        });
    });

    /**
     * GET /api/profile/loyalty
     * Отримати штампи лояльності
     */
    app.get('/loyalty', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;

        const [stamps, settings] = await Promise.all([
            prisma.loyaltyStamp.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.loyaltySettings.findFirst({
                where: { isActive: true },
            }),
        ]);

        const stampsForReward = settings?.stampsForReward ?? 10;
        const currentStamps = stampsForReward > 0
            ? stamps.filter((s: any) => !s.isReward).length % stampsForReward
            : stamps.filter((s: any) => !s.isReward).length;
        const totalRewards = stamps.filter((s: any) => s.isReward).length;

        return reply.send({
            success: true,
            data: {
                currentStamps,
                stampsForReward: settings?.stampsForReward ?? 10,
                totalRewards,
                stamps,
            },
        });
    });
}
