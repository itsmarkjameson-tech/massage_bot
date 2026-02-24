import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole, type UserRole } from '../../shared/middleware/auth.middleware.js';

// Validation schemas
const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

const roleUpdateSchema = z.object({
    role: z.nativeEnum(UserRole),
});

export async function adminUsersRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/users
     * Список всіх користувачів з пагінацією
     */
    app.get('/', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; role?: string } }>, reply: FastifyReply) => {
        const parseResult = paginationSchema.safeParse(request.query);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { page, limit } = parseResult.data;
        const { search, role } = request.query;

        const where: any = {};

        if (role) where.role = role;
        if (search) {
            where.OR = [
                { telegramUsername: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
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
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            bookings: true,
                            reviews: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                users,
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
     * GET /api/admin/users/:id
     * Деталі користувача
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const user = await prisma.user.findUnique({
            where: { id },
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
                isActive: true,
                createdAt: true,
                updatedAt: true,
                master: true,
                _count: {
                    select: {
                        bookings: true,
                        reviews: true,
                        loyaltyStamps: true,
                    },
                },
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
            data: { user },
        });
    });

    /**
     * PATCH /api/admin/users/:id/role
     * Змінити роль користувача
     */
    app.patch('/:id/role', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = roleUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { role } = parseResult.data;

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'User not found', code: 'NOT_FOUND' },
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                telegramId: true,
                telegramUsername: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        return reply.send({
            success: true,
            data: { user },
        });
    });

    /**
     * GET /api/admin/users/:id/bookings
     * Історія бронювань користувача
     */
    app.get('/:id/bookings', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const page = parseInt(request.query.page || '1');
        const limit = parseInt(request.query.limit || '20');

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return reply.status(404).send({
                success: false,
                error: { message: 'User not found', code: 'NOT_FOUND' },
            });
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: { userId: id },
                include: {
                    master: {
                        select: {
                            id: true,
                            displayName: true,
                            photoUrl: true,
                        },
                    },
                    items: {
                        include: {
                            service: { select: { id: true, name: true } },
                            duration: { select: { id: true, durationMinutes: true } },
                        },
                    },
                },
                orderBy: { bookingDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.booking.count({ where: { userId: id } }),
        ]);

        return reply.send({
            success: true,
            data: {
                bookings,
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
     * PATCH /api/admin/users/:id
     * Оновити дані користувача
     */
    app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const updateSchema = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            phone: z.string().optional(),
            avatarUrl: z.string().url().optional(),
            language: z.string().optional(),
            isActive: z.boolean().optional(),
        });

        const parseResult = updateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'User not found', code: 'NOT_FOUND' },
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: parseResult.data,
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
                isActive: true,
            },
        });

        return reply.send({
            success: true,
            data: { user },
        });
    });
}
