import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { getUserNotifications, sendTestNotification } from '../../services/notification.service.js';
import { process24HourReminders, process2HourReminders, processReviewRequests } from '../../queues/workers.js';

/**
 * Роут для cron задач (захищений API ключем)
 */
export async function cronRoutes(app: FastifyInstance) {
    /**
     * POST /api/cron/reminders
     * Запустити нагадування (для тестування або виклику з cron)
     */
    app.post('/reminders', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const results = await Promise.all([
                process24HourReminders(),
                process2HourReminders(),
            ]);

            return reply.send({
                success: true,
                data: {
                    reminders_24h: results[0],
                    reminders_2h: results[1],
                    total: results[0] + results[1],
                },
            });
        } catch (error) {
            console.error('Error processing reminders:', error);
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to process reminders', code: 'INTERNAL_ERROR' },
            });
        }
    });

    /**
     * POST /api/cron/reviews
     * Запустити запити відгуків
     */
    app.post('/reviews', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const count = await processReviewRequests();

            return reply.send({
                success: true,
                data: {
                    review_requests: count,
                },
            });
        } catch (error) {
            console.error('Error processing review requests:', error);
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to process review requests', code: 'INTERNAL_ERROR' },
            });
        }
    });
}

/**
 * Роут для сповіщень користувача
 */
export async function notificationsRoutes(app: FastifyInstance) {
    /**
     * GET /api/notifications
     * Отримати список сповіщень користувача
     */
    app.get('/', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;
        const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string };

        try {
            const result = await getUserNotifications(userId, parseInt(limit), parseInt(offset));

            return reply.send({
                success: true,
                data: {
                    notifications: result.notifications,
                    total: result.total,
                    hasMore: result.hasMore,
                },
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to fetch notifications', code: 'INTERNAL_ERROR' },
            });
        }
    });

    /**
     * POST /api/notifications/test
     * Відправити тестове сповіщення (тільки для адмінів)
     */
    app.post('/test', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;
        const { message } = request.body as { message?: string };

        if (!message) {
            return reply.status(400).send({
                success: false,
                error: { message: 'Message is required', code: 'VALIDATION_ERROR' },
            });
        }

        try {
            // Отримати telegramId користувача
            const { prisma } = await import('../../config/database.js');
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { telegramId: true },
            });

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: { message: 'User not found', code: 'NOT_FOUND' },
                });
            }

            const success = await sendTestNotification(user.telegramId, message);

            return reply.send({
                success,
                data: {
                    message: success ? 'Test notification sent' : 'Failed to send notification',
                },
            });
        } catch (error) {
            console.error('Error sending test notification:', error);
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to send test notification', code: 'INTERNAL_ERROR' },
            });
        }
    });
}
