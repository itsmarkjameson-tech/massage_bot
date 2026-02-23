import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Validation schemas
const comboCreateSchema = z.object({
    name: z.record(z.string()), // { "uk": "...", "en": "...", "ru": "..." }
    description: z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    discountPercent: z.number().min(0).max(100).default(0),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    items: z.array(z.object({
        serviceId: z.string().uuid(),
        durationId: z.string().uuid(),
        sortOrder: z.number().int().default(0),
    })).optional(),
});

const comboUpdateSchema = comboCreateSchema.partial();

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function adminCombosRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/combos
     * Список всіх комбо з пагінацією
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

        const [combos, total] = await Promise.all([
            prisma.combo.findMany({
                where,
                include: {
                    items: {
                        include: {
                            service: true,
                            duration: true,
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                orderBy: { sortOrder: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.combo.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                combos,
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
     * GET /api/admin/combos/:id
     * Деталі комбо
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const combo = await prisma.combo.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        service: true,
                        duration: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!combo) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Combo not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { combo },
        });
    });

    /**
     * POST /api/admin/combos
     * Створити нове комбо
     */
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = comboCreateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { items, ...comboData } = parseResult.data;

        const combo = await prisma.combo.create({
            data: {
                ...comboData,
                items: items
                    ? {
                        create: items.map((item) => ({
                            serviceId: item.serviceId,
                            durationId: item.durationId,
                            sortOrder: item.sortOrder,
                        })),
                    }
                    : undefined,
            },
            include: {
                items: {
                    include: {
                        service: true,
                        duration: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        return reply.status(201).send({
            success: true,
            data: { combo },
        });
    });

    /**
     * PUT /api/admin/combos/:id
     * Оновити комбо
     */
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = comboUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { items, ...comboData } = parseResult.data;

        // Check if combo exists
        const existing = await prisma.combo.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Combo not found', code: 'NOT_FOUND' },
            });
        }

        // If items are provided, update them
        if (items) {
            await prisma.$transaction([
                prisma.comboItem.deleteMany({ where: { comboId: id } }),
                prisma.comboItem.createMany({
                    data: items.map((item) => ({
                        comboId: id,
                        serviceId: item.serviceId,
                        durationId: item.durationId,
                        sortOrder: item.sortOrder,
                    })),
                }),
            ]);
        }

        const combo = await prisma.combo.update({
            where: { id },
            data: comboData,
            include: {
                items: {
                    include: {
                        service: true,
                        duration: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        return reply.send({
            success: true,
            data: { combo },
        });
    });

    /**
     * DELETE /api/admin/combos/:id
     * Видалити комбо (soft delete)
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.combo.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Combo not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.combo.update({
            where: { id },
            data: { isActive: false },
        });

        return reply.send({
            success: true,
            data: { message: 'Combo deleted successfully' },
        });
    });
}
