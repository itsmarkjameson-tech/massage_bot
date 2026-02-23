import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Validation schemas
const serviceCreateSchema = z.object({
    categoryId: z.string().uuid().optional(),
    name: z.record(z.string()), // { "uk": "...", "en": "...", "ru": "..." }
    description: z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    requiresConfirmation: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    durations: z.array(z.object({
        durationMinutes: z.number().int().positive(),
        basePrice: z.number().nonnegative(),
    })).optional(),
});

const serviceUpdateSchema = serviceCreateSchema.partial();

const categoryCreateSchema = z.object({
    parentId: z.string().uuid().optional(),
    name: z.record(z.string()),
    description: z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const categoryUpdateSchema = categoryCreateSchema.partial();

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function adminServicesRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/services
     * Список всіх послуг з пагінацією
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
                    { name: { path: ['uk'], string_contains: search } },
                    { name: { path: ['en'], string_contains: search } },
                    { name: { path: ['ru'], string_contains: search } },
                ],
            }
            : {};

        const [services, total] = await Promise.all([
            prisma.service.findMany({
                where,
                include: {
                    category: true,
                    durations: { orderBy: { durationMinutes: 'asc' } },
                },
                orderBy: { sortOrder: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.service.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                services,
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
     * POST /api/admin/services
     * Створити нову послугу
     */
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = serviceCreateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { durations, ...serviceData } = parseResult.data;

        const service = await prisma.service.create({
            data: {
                ...serviceData,
                durations: durations
                    ? {
                        create: durations.map((d) => ({
                            durationMinutes: d.durationMinutes,
                            basePrice: d.basePrice,
                        })),
                    }
                    : undefined,
            },
            include: {
                durations: { orderBy: { durationMinutes: 'asc' } },
                category: true,
            },
        });

        return reply.status(201).send({
            success: true,
            data: { service },
        });
    });

    /**
     * PUT /api/admin/services/:id
     * Оновити послугу
     */
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = serviceUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { durations, ...serviceData } = parseResult.data;

        // Check if service exists
        const existing = await prisma.service.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Service not found', code: 'NOT_FOUND' },
            });
        }

        // If durations are provided, update them
        if (durations) {
            await prisma.$transaction([
                prisma.serviceDuration.deleteMany({ where: { serviceId: id } }),
                prisma.serviceDuration.createMany({
                    data: durations.map((d) => ({
                        serviceId: id,
                        durationMinutes: d.durationMinutes,
                        basePrice: d.basePrice,
                    })),
                }),
            ]);
        }

        const service = await prisma.service.update({
            where: { id },
            data: serviceData,
            include: {
                durations: { orderBy: { durationMinutes: 'asc' } },
                category: true,
            },
        });

        return reply.send({
            success: true,
            data: { service },
        });
    });

    /**
     * DELETE /api/admin/services/:id
     * Видалити послугу (soft delete)
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.service.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Service not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.service.update({
            where: { id },
            data: { isActive: false },
        });

        return reply.send({
            success: true,
            data: { message: 'Service deleted successfully' },
        });
    });

    // ============================================
    // Categories
    // ============================================

    /**
     * GET /api/admin/categories
     * Список всіх категорій
     */
    app.get('/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                children: true,
                services: { select: { id: true } },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return reply.send({
            success: true,
            data: { categories },
        });
    });

    /**
     * POST /api/admin/categories
     * Створити категорію
     */
    app.post('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = categoryCreateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const category = await prisma.serviceCategory.create({
            data: parseResult.data,
        });

        return reply.status(201).send({
            success: true,
            data: { category },
        });
    });

    /**
     * PUT /api/admin/categories/:id
     * Оновити категорію
     */
    app.put('/categories/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = categoryUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const existing = await prisma.serviceCategory.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Category not found', code: 'NOT_FOUND' },
            });
        }

        const category = await prisma.serviceCategory.update({
            where: { id },
            data: parseResult.data,
        });

        return reply.send({
            success: true,
            data: { category },
        });
    });

    /**
     * DELETE /api/admin/categories/:id
     * Видалити категорію (soft delete)
     */
    app.delete('/categories/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.serviceCategory.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Category not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.serviceCategory.update({
            where: { id },
            data: { isActive: false },
        });

        return reply.send({
            success: true,
            data: { message: 'Category deleted successfully' },
        });
    });
}
