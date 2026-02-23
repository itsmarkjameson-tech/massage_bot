import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { telegramAuthSchema } from './auth.schema.js';
import { authService } from './auth.service.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
    /**
     * POST /api/auth/telegram
     * Автентифікація через Telegram WebApp initData
     */
    app.post('/telegram', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = telegramAuthSchema.parse(request.body);

        try {
            const result = await authService.authenticateWithTelegram(body.initData);

            // Generate JWT token
            const token = app.jwt.sign({
                userId: result.userId,
                telegramId: result.telegramId,
                role: result.role,
            });

            return reply.send({
                success: true,
                data: {
                    token,
                    user: result.profile,
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            return reply.status(401).send({
                success: false,
                error: { message, code: 'AUTH_FAILED' },
            });
        }
    });

    /**
     * GET /api/auth/me
     * Отримати поточного автентифікованого користувача
     */
    app.get('/me', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;

        const user = await import('../../config/database.js').then(({ prisma }) =>
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    telegramUsername: true,
                    avatarUrl: true,
                    role: true,
                    language: true,
                },
            })
        );

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: { message: 'User not found', code: 'USER_NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { user },
        });
    });
}
