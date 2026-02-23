import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.controller.js';
import { usersRoutes } from './modules/users/users.controller.js';
import { servicesRoutes } from './modules/services/services.controller.js';
import { mastersRoutes } from './modules/masters/masters.controller.js';
import { bookingsRoutes } from './modules/bookings/bookings.controller.js';
import { reviewsRoutes } from './modules/reviews/reviews.controller.js';
import { profileRoutes } from './modules/profile/profile.controller.js';
import { promotionsRoutes } from './modules/promotions/promotions.controller.js';
import { notificationsRoutes, cronRoutes } from './modules/notifications/notifications.controller.js';
import { masterDashboardRoutes } from './modules/master-dashboard/master-dashboard.controller.js';
import { adminServicesRoutes } from './modules/admin/services.controller.js';
import { adminCombosRoutes } from './modules/admin/combos.controller.js';
import { adminMastersRoutes } from './modules/admin/masters.controller.js';
import { adminBookingsRoutes } from './modules/admin/bookings.controller.js';
import { adminUsersRoutes } from './modules/admin/users.controller.js';
import { adminPromoCodesRoutes } from './modules/admin/promo-codes.controller.js';
import { adminLoyaltyRoutes } from './modules/admin/loyalty.controller.js';
import { adminReviewsRoutes } from './modules/admin/reviews.controller.js';
import { adminAnalyticsRoutes } from './modules/admin/analytics.controller.js';
import { waitlistRoutes } from './modules/waitlist/waitlist.controller.js';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { bot } from './bot/bot.js';

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.NODE_ENV === 'development' ? 'info' : 'warn',
            transport:
                env.NODE_ENV === 'development'
                    ? { target: 'pino-pretty', options: { colorize: true } }
                    : undefined,
        },
    });

    // Plugins
    await app.register(cors, {
        origin: env.CORS_ORIGIN,
        credentials: true,
    });

    await app.register(jwt, {
        secret: env.JWT_SECRET,
        sign: { expiresIn: env.JWT_EXPIRES_IN },
    });

    await app.register(sensible);

    // Error handler
    app.setErrorHandler(errorHandler);

    // Health check
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // API Routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(usersRoutes, { prefix: '/api/users' });
    await app.register(servicesRoutes, { prefix: '/api/services' });
    await app.register(mastersRoutes, { prefix: '/api/masters' });
    await app.register(bookingsRoutes, { prefix: '/api/bookings' });
    await app.register(reviewsRoutes, { prefix: '/api/reviews' });
    await app.register(profileRoutes, { prefix: '/api/profile' });
    await app.register(promotionsRoutes, { prefix: '/api/promotions' });
    await app.register(notificationsRoutes, { prefix: '/api/notifications' });
    await app.register(cronRoutes, { prefix: '/api/cron' });

    // Master routes
    await app.register(masterDashboardRoutes, { prefix: '/api/master' });

    // Admin routes
    await app.register(adminServicesRoutes, { prefix: '/api/admin' });
    await app.register(adminCombosRoutes, { prefix: '/api/admin/combos' });
    await app.register(adminMastersRoutes, { prefix: '/api/admin' });
    await app.register(adminBookingsRoutes, { prefix: '/api/admin' });
    await app.register(adminUsersRoutes, { prefix: '/api/admin' });
    await app.register(adminPromoCodesRoutes, { prefix: '/api/admin' });
    await app.register(adminLoyaltyRoutes, { prefix: '/api/admin/loyalty' });
    await app.register(adminReviewsRoutes, { prefix: '/api/admin' });
    await app.register(adminAnalyticsRoutes, { prefix: '/api/admin/analytics' });

    // Waitlist routes
    await app.register(waitlistRoutes, { prefix: '/api/waitlist' });

    // Telegram Webhook endpoint
    if (env.BOT_WEBHOOK_URL && env.NODE_ENV === 'production') {
        await app.register(async (fastify) => {
            fastify.post('/webhook', async (request, reply) => {
                try {
                    await bot.handleUpdate(request.body as any);
                    return { ok: true };
                } catch (error) {
                    console.error('Webhook error:', error);
                    reply.status(500).send({ error: 'Webhook processing failed' });
                }
            });
        });
    }

    return app;
}
