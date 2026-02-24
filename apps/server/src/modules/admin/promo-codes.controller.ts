import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { requireRole } from '../../shared/middleware/auth.middleware.js';

// Local type since Prisma client may not be generated
export type DiscountType = 'percent' | 'fixed';

// Validation schemas
const promoCodeCreateSchema = z.object({
    code: z.string().min(3).max(50),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().nonnegative().optional(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.string(),
    validUntil: z.string(),
    isActive: z.boolean().default(true),
});

const promoCodeUpdateSchema = promoCodeCreateSchema.partial();

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function adminPromoCodesRoutes(app: FastifyInstance) {
    // Apply admin authentication to all routes
    app.addHook('onRequest', async (request, reply) => {
        await requireRole('admin', 'owner')(request, reply);
    });

    /**
     * GET /api/admin/promo-codes
     * Список всіх промокодів з пагінацією
     */
    app.get('/', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; isActive?: string } }>, reply: FastifyReply) => {
        const parseResult = paginationSchema.safeParse(request.query);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const { page, limit } = parseResult.data;
        const { search, isActive } = request.query;

        const where: any = {};

        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (search) where.code = { contains: search };

        const [promoCodes, total] = await Promise.all([
            prisma.promoCode.findMany({
                where,
                include: {
                    _count: {
                        select: { bookings: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.promoCode.count({ where }),
        ]);

        return reply.send({
            success: true,
            data: {
                promoCodes,
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
     * GET /api/admin/promo-codes/:id
     * Деталі промокоду
     */
    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const promoCode = await prisma.promoCode.findUnique({
            where: { id },
            include: {
                bookings: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        user: {
                            select: {
                                id: true,
                                telegramUsername: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { bookings: true },
                },
            },
        });

        if (!promoCode) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Promo code not found', code: 'NOT_FOUND' },
            });
        }

        return reply.send({
            success: true,
            data: { promoCode },
        });
    });

    /**
     * POST /api/admin/promo-codes
     * Створити новий промокод
     */
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = promoCodeCreateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const data = parseResult.data;

        // Check if code already exists
        const existing = await prisma.promoCode.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            return reply.status(400).send({
                success: false,
                error: { message: 'Promo code already exists', code: 'DUPLICATE_CODE' },
            });
        }

        const promoCode = await prisma.promoCode.create({
            data: {
                ...data,
                validFrom: new Date(data.validFrom),
                validUntil: new Date(data.validUntil),
            },
        });

        return reply.status(201).send({
            success: true,
            data: { promoCode },
        });
    });

    /**
     * PUT /api/admin/promo-codes/:id
     * Оновити промокод
     */
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const parseResult = promoCodeUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: { message: parseResult.error.errors[0]?.message, code: 'VALIDATION_ERROR' },
            });
        }

        const data = parseResult.data;

        const existing = await prisma.promoCode.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Promo code not found', code: 'NOT_FOUND' },
            });
        }

        // If code is being changed, check for duplicates
        if (data.code && data.code !== existing.code) {
            const duplicate = await prisma.promoCode.findUnique({
                where: { code: data.code },
            });
            if (duplicate) {
                return reply.status(400).send({
                    success: false,
                    error: { message: 'Promo code already exists', code: 'DUPLICATE_CODE' },
                });
            }
        }

        const updateData: any = { ...data };
        if (data.validFrom) updateData.validFrom = new Date(data.validFrom as string);
        if (data.validUntil) updateData.validUntil = new Date(data.validUntil as string);

        const promoCode = await prisma.promoCode.update({
            where: { id },
            data: updateData,
        });

        return reply.send({
            success: true,
            data: { promoCode },
        });
    });

    /**
     * DELETE /api/admin/promo-codes/:id
     * Видалити промокод (soft delete)
     */
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;

        const existing = await prisma.promoCode.findUnique({ where: { id } });
        if (!existing) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Promo code not found', code: 'NOT_FOUND' },
            });
        }

        await prisma.promoCode.update({
            where: { id },
            data: { isActive: false },
        });

        return reply.send({
            success: true,
            data: { message: 'Promo code deleted successfully' },
        });
    });
}
