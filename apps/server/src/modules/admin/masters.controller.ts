import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole, type UserRole } from '../../shared/middleware/auth.middleware.js';

// Validation schemas
const masterCreateSchema = z.object({
    telegramId: z.number().int().positive(),
    telegramUsername: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    displayName: z.record(z.string()), // { "uk": "...", "en": "...", "ru": "..." }
    bio: z.record(z.string()).optional(),
    photoUrl: z.string().url().optional(),
    specialization: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    services: z.array(z.object({
        serviceId: z.string().uuid(),
        priceModifier: z.number().default(0),
    })).optional(),
});

const masterUpdateSchema = z.object({
    displayName: z.record(z.string()).optional(),
    bio: z.record(z.string()).optional(),
    photoUrl: z.string().url().optional(),
    specialization: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    services: z.array(z.object({
        serviceId: z.string().uuid(),
        priceModifier: z.number().default(0),
    })).optional(),
});

const scheduleSchema = z.object({
    workDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isDayOff: z.boolean().default(false),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function adminMastersRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/masters
     * Список всіх майстрів з пагінацією
     */
    app.get('/', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string } }>, reply: FastifyReply) => {
        const parseResult = paginationSchema.safeParse(request.query);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { page, limit } = parseResult.data;
        const search = request.query.search;

        const where = search
            ? {
                OR: [
                    { displayName: { path: ['uk'], string_contains: search } },
                    { displayName: { path: ['en'], string_contains: search } },
                    { displayName: { path: ['ru'], string_contains: search } },
                    { user: { telegramUsername: { contains: search } } },
                ],
            }
            : {};

        const [masters, total] = await Promise.all([
            prisma.master.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            telegramId: true,
                            telegramUsername: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                    masterServices: {
                        include: {
                            service: { select: { id: true, name: true } },
                        },
                    },
                    reviews: {
                        where: { status: 'approved' },
                        select: { rating: true },
                    },
                },
                orderBy: { sortOrder: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.master.count({ where }),
        ]);

        // Calculate average rating for each master
        const mastersWithRating = masters.map((master) => {
            const ratings = master.reviews.map((r) => r.rating);
            const avgRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            return {
                ...master,
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: ratings.length,
            };
        });

        return reply.send({
            success: true,
            data: {
                masters: mastersWithRating,
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
     * GET /api/admin/masters/:id
     * Деталі майстра
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const master = await prisma.master.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        isActive: true,
                    },
                },
                masterServices: {
                    include: {
                        service: true,
                    },
                },
                schedules: {
                    orderBy: { workDate: 'asc' },
                    take: 30,
                },
                reviews: {
                    where: { status: 'approved' },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!master) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { master },
        });
    });

    /**
     * POST /api/admin/masters
     * Створити нового майстра (з зв'язкою User)
     */
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = masterCreateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { services, ...masterData } = parseResult.data;
        const { telegramId, telegramUsername, firstName, lastName, phone } = masterData as any;

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { telegramId },
        });

        // Create user if doesn't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId,
                    telegramUsername,
                    firstName,
                    lastName,
                    phone,
                    role: UserRole.master,
                },
            });
        } else {
            // Update existing user to master role
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: UserRole.master },
            });
        }

        // Create master profile
        const master = await prisma.master.create({
            data: {
                userId: user.id,
                displayName: masterData.displayName,
                bio: masterData.bio,
                photoUrl: masterData.photoUrl,
                specialization: masterData.specialization,
                isActive: masterData.isActive ?? true,
                sortOrder: masterData.sortOrder ?? 0,
                masterServices: services
                    ? {
                        create: services.map((s) => ({
                            serviceId: s.serviceId,
                            priceModifier: s.priceModifier,
                        })),
                    }
                    : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                masterServices: {
                    include: {
                        service: true,
                    },
                },
            },
        });

        return reply.status(201).send({
            success: true,
            data: { master },
        });
    });

    /**
     * PUT /api/admin/masters/:id
     * Оновити майстра
     */
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = masterUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { services, ...masterData } = parseResult.data;

        // Check if master exists
        const existing = await prisma.master.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        // Update services if provided
        if (services) {
            await prisma.$transaction([
                prisma.masterService.deleteMany({ where: { masterId: id } }),
                prisma.masterService.createMany({
                    data: services.map((s) => ({
                        masterId: id,
                        serviceId: s.serviceId,
                        priceModifier: s.priceModifier,
                    })),
                }),
            ]);
        }

        const master = await prisma.master.update({
            where: { id },
            data: masterData,
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        telegramUsername: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                masterServices: {
                    include: {
                        service: true,
                    },
                },
            },
        });

        return reply.send({
            success: true,
            data: { master },
        });
    });

    /**
     * DELETE /api/admin/masters/:id
     * Видалити майстра (soft delete)
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.master.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.master.update({
            where: { id },
            data: { isActive: false },
        });

        return reply.send({
            success: true,
            data: { message: 'Master deleted successfully' },
        });
    });

    /**
     * PUT /api/admin/masters/:id/schedule
     * Управління розкладом майстра
     */
    app.put('/:id/schedule', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        // Check if master exists
        const existing = await prisma.master.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        const parseResult = z.array(scheduleSchema).safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const schedules = parseResult.data;

        // Delete existing schedules for the provided dates and create new ones
        const datesToUpdate = schedules.map((s) => new Date(s.workDate));

        await prisma.$transaction([
            prisma.masterSchedule.deleteMany({
                where: {
                    masterId: id,
                    workDate: { in: datesToUpdate },
                },
            }),
            prisma.masterSchedule.createMany({
                data: schedules.map((s) => ({
                    masterId: id,
                    workDate: new Date(s.workDate),
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isDayOff: s.isDayOff,
                })),
            }),
        ]);

        const updatedSchedules = await prisma.masterSchedule.findMany({
            where: {
                masterId: id,
                workDate: { in: datesToUpdate },
            },
            orderBy: { workDate: 'asc' },
        });

        return reply.send({
            success: true,
            data: { schedules: updatedSchedules },
        });
    });

    /**
     * GET /api/admin/masters/:id/schedule
     * Отримати розклад майстра
     */
    app.get('/:id/schedule', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { startDate, endDate } = request.query;

        const where: any = { masterId: id };

        if (startDate || endDate) {
            where.workDate = {};
            if (startDate) (where.workDate as any).gte = new Date(startDate);
            if (endDate) (where.workDate as any).lte = new Date(endDate);
        }

        const schedules = await prisma.masterSchedule.findMany({
            where,
            orderBy: { workDate: 'asc' },
        });

        return reply.send({
            success: true,
            data: { schedules },
        });
    });
}
