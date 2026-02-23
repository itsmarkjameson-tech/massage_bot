import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { prisma } from '../../config/database.js';
import { sendNotification, scheduleNotification } from '../../services/notification.service.js';
import { format, addHours } from 'date-fns';

// Валідація параметрів запиту слотів
const slotsQuerySchema = z.object({
    masterId: z.string().uuid('Invalid master ID'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    durationMinutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
});

// Валідація тіла запиту створення бронювання
const createBookingSchema = z.object({
    masterId: z.string().uuid('Invalid master ID'),
    bookingDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    startTime: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    serviceDurations: z.array(z.object({
        serviceId: z.string().uuid('Invalid service ID'),
        durationId: z.string().uuid('Invalid duration ID'),
    })).min(1, 'At least one service is required'),
    promoCode: z.string().optional(),
});

// Валідація промокоду
const validatePromoSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
    totalAmount: z.number().min(0, 'Total amount must be positive'),
});

export async function bookingsRoutes(app: FastifyInstance) {
    /**
     * GET /api/bookings/slots
     * Отримати вільні слоти для бронювання
     */
    app.get<{ Querystring: { masterId: string; date: string; durationMinutes: string } }>(
        '/slots',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const parseResult = slotsQuerySchema.safeParse(request.query);

            if (!parseResult.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        message: parseResult.error.errors[0]?.message || 'Invalid query parameters',
                        code: 'VALIDATION_ERROR',
                    },
                });
            }

            const { masterId, date, durationMinutes } = parseResult.data;

            // Get master schedule for the date
            const schedule = await prisma.masterSchedule.findUnique({
                where: {
                    masterId_workDate: {
                        masterId,
                        workDate: new Date(date),
                    },
                },
            });

            if (!schedule || schedule.isDayOff) {
                return reply.send({
                    success: true,
                    data: { slots: [] },
                });
            }

            // Get existing bookings for the master on this date
            const existingBookings = await prisma.booking.findMany({
                where: {
                    masterId,
                    bookingDate: new Date(date),
                    status: {
                        notIn: ['cancelled_by_client', 'cancelled_by_admin'],
                    },
                },
                select: { startTime: true, endTime: true },
            });

            // Generate available slots
            const slots = generateTimeSlots(
                schedule.startTime,
                schedule.endTime,
                durationMinutes,
                15, // buffer minutes - TODO: get from settings
                existingBookings
            );

            return reply.send({
                success: true,
                data: { slots },
            });
        });

    /**
     * POST /api/bookings
     * Створити нове бронювання
     */
    app.post('/', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = createBookingSchema.safeParse(request.body);

        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: parseResult.error.errors[0]?.message || 'Invalid request body',
                    code: 'VALIDATION_ERROR',
                },
            });
        }

        const { masterId, bookingDate, startTime, serviceDurations, promoCode } = parseResult.data;
        const { userId } = request.user;

        // Parse date
        const parsedDate = new Date(bookingDate);
        parsedDate.setHours(0, 0, 0, 0);

        // Validate master exists and is active
        const master = await prisma.master.findUnique({
            where: { id: masterId, isActive: true },
        });

        if (!master) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Master not found', code: 'NOT_FOUND' },
            });
        }

        // Validate services and durations, calculate total duration and price
        let totalDuration = 0;
        let totalPrice = 0;
        const bookingItems: { serviceId: string; durationId: string; price: number }[] = [];

        for (const sd of serviceDurations) {
            const duration = await prisma.serviceDuration.findUnique({
                where: { id: sd.durationId, isActive: true },
                include: { service: true },
            });

            if (!duration || duration.serviceId !== sd.serviceId) {
                return reply.status(400).send({
                    success: false,
                    error: { message: `Invalid service/duration combination`, code: 'INVALID_SERVICE' },
                });
            }

            // Check if master provides this service
            const masterService = await prisma.masterService.findUnique({
                where: {
                    masterId_serviceId: { masterId, serviceId: sd.serviceId },
                },
            });

            if (!masterService) {
                return reply.status(400).send({
                    success: false,
                    error: { message: `Master does not provide this service`, code: 'MASTER_SERVICE_NOT_AVAILABLE' },
                });
            }

            // Calculate price with master's modifier
            const basePrice = Number(duration.basePrice);
            const modifier = Number(masterService.priceModifier);
            const itemPrice = basePrice + modifier;

            totalDuration += duration.durationMinutes;
            totalPrice += itemPrice;

            bookingItems.push({
                serviceId: sd.serviceId,
                durationId: sd.durationId,
                price: itemPrice,
            });
        }

        // Calculate end time
        const endTime = calculateEndTime(startTime, totalDuration);

        // Check slot availability
        const existingBookings = await prisma.booking.findMany({
            where: {
                masterId,
                bookingDate: parsedDate,
                status: { notIn: ['cancelled_by_client', 'cancelled_by_admin'] },
            },
            select: { startTime: true, endTime: true },
        });

        const hasConflict = existingBookings.some((booking) => {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);
            const newStart = timeToMinutes(startTime);
            const newEnd = timeToMinutes(endTime);

            return newStart < bookingEnd && newEnd > bookingStart;
        });

        if (hasConflict) {
            return reply.status(409).send({
                success: false,
                error: { message: 'Time slot is already booked', code: 'SLOT_NOT_AVAILABLE' },
            });
        }

        // Validate promo code if provided
        let promoCodeId: string | null = null;
        let discountAmount = 0;

        if (promoCode) {
            const promo = await prisma.promoCode.findUnique({
                where: { code: promoCode },
            });

            if (promo && promo.isActive) {
                const now = new Date();
                const isValid = now >= promo.validFrom && now <= promo.validUntil;
                const hasUsesLeft = promo.maxUses === null || promo.currentUses < promo.maxUses;
                const meetsMinAmount = promo.minOrderAmount === null || totalPrice >= Number(promo.minOrderAmount);

                if (isValid && hasUsesLeft && meetsMinAmount) {
                    promoCodeId = promo.id;

                    if (promo.discountType === 'percent') {
                        discountAmount = (totalPrice * Number(promo.discountValue)) / 100;
                    } else {
                        discountAmount = Math.min(Number(promo.discountValue), totalPrice);
                    }
                }
            }
        }

        const finalPrice = totalPrice - discountAmount;

        // Get loyalty settings
        const loyaltySettings = await prisma.loyaltySettings.findFirst({
            where: { isActive: true },
        });

        // Count user's stamps
        const userStamps = await prisma.loyaltyStamp.count({
            where: { userId, isReward: false },
        });

        // Determine booking status (pending_confirmation for now)
        const bookingStatus: 'pending_confirmation' = 'pending_confirmation';

        // Create booking with items in transaction
        const booking = await prisma.$transaction(async (tx) => {
            // Create booking
            const newBooking = await tx.booking.create({
                data: {
                    userId,
                    masterId,
                    bookingDate: parsedDate,
                    startTime,
                    endTime,
                    status: bookingStatus,
                    totalPrice: finalPrice,
                    discountAmount,
                    promoCodeId,
                    items: {
                        create: bookingItems.map((item, index) => ({
                            serviceId: item.serviceId,
                            durationId: item.durationId,
                            price: item.price,
                            sortOrder: index,
                        })),
                    },
                },
                include: {
                    master: { select: { displayName: true, photoUrl: true } },
                    items: {
                        include: {
                            service: { select: { name: true } },
                            duration: { select: { durationMinutes: true } },
                        },
                    },
                },
            });

            // Create loyalty stamp
            if (loyaltySettings) {
                const nextStampNumber = userStamps + 1;
                const isReward = loyaltySettings.stampsForReward > 0 &&
                    nextStampNumber % loyaltySettings.stampsForReward === 0;

                await tx.loyaltyStamp.create({
                    data: {
                        userId,
                        bookingId: newBooking.id,
                        stampNumber: nextStampNumber,
                        isReward,
                    },
                });

                // Increment promo code usage
                if (promoCodeId) {
                    await tx.promoCode.update({
                        where: { id: promoCodeId },
                        data: { currentUses: { increment: 1 } },
                    });
                }
            }

            return newBooking;
        });

        // Відправити сповіщення про створення бронювання
        const services = booking.items.map(item => (item.service.name as any)?.uk || String(item.service.name)).join(', ');
        const masterName = (booking.master?.displayName as any)?.uk || '';

        sendNotification({
            type: 'booking_created',
            userId: userId,
            bookingId: booking.id,
            params: {
                master_name: masterName,
                service_name: services,
                date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                time: booking.startTime,
            },
        }).catch(err => console.error('Failed to send notification:', err));

        // Запланувати нагадування
        const bookingDateTime = new Date(booking.bookingDate);
        const [hours, minutes] = booking.startTime.split(':').map(Number);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        // Нагадування за 24 години
        const reminder24h = addHours(bookingDateTime, -24);
        if (reminder24h > new Date()) {
            scheduleNotification(
                userId,
                'reminder_24h',
                reminder24h,
                booking.id,
                {
                    master_name: masterName,
                    service_name: services,
                    date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                    time: booking.startTime,
                }
            ).catch(err => console.error('Failed to schedule 24h reminder:', err));
        }

        // Нагадування за 2 години
        const reminder2h = addHours(bookingDateTime, -2);
        if (reminder2h > new Date()) {
            scheduleNotification(
                userId,
                'reminder_2h',
                reminder2h,
                booking.id,
                {
                    master_name: masterName,
                    service_name: services,
                    date: format(new Date(booking.bookingDate), 'dd.MM.yyyy'),
                    time: booking.startTime,
                }
            ).catch(err => console.error('Failed to schedule 2h reminder:', err));
        }

        return reply.status(201).send({
            success: true,
            data: {
                booking: {
                    id: booking.id,
                    bookingDate: booking.bookingDate,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    status: booking.status,
                    totalPrice: booking.totalPrice,
                    discountAmount: booking.discountAmount,
                    master: booking.master,
                    items: booking.items,
                },
            },
        });
    });

    /**
     * POST /api/bookings/validate-promo
     * Валідація промокоду
     */
    app.post('/validate-promo', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = validatePromoSchema.safeParse(request.body);

        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: parseResult.error.errors[0]?.message || 'Invalid request body',
                    code: 'VALIDATION_ERROR',
                },
            });
        }

        const { code, totalAmount } = parseResult.data;

        const promo = await prisma.promoCode.findUnique({
            where: { code },
        });

        if (!promo || !promo.isActive) {
            return reply.status(404).send({
                success: false,
                error: { message: 'Promo code not found or inactive', code: 'PROMO_NOT_FOUND' },
            });
        }

        const now = new Date();
        const isValid = now >= promo.validFrom && now <= promo.validUntil;

        if (!isValid) {
            return reply.status(400).send({
                success: false,
                error: { message: 'Promo code has expired', code: 'PROMO_EXPIRED' },
            });
        }

        const hasUsesLeft = promo.maxUses === null || promo.currentUses < promo.maxUses;

        if (!hasUsesLeft) {
            return reply.status(400).send({
                success: false,
                error: { message: 'Promo code usage limit reached', code: 'PROMO_LIMIT_REACHED' },
            });
        }

        const meetsMinAmount = promo.minOrderAmount === null || totalAmount >= Number(promo.minOrderAmount);

        if (!meetsMinAmount) {
            return reply.status(400).send({
                success: false,
                error: {
                    message: `Minimum order amount for this promo code is ${promo.minOrderAmount}`,
                    code: 'PROMO_MIN_AMOUNT',
                },
            });
        }

        // Calculate discount
        let discountAmount: number;
        if (promo.discountType === 'percent') {
            discountAmount = (totalAmount * Number(promo.discountValue)) / 100;
        } else {
            discountAmount = Math.min(Number(promo.discountValue), totalAmount);
        }

        return reply.send({
            success: true,
            data: {
                promoCode: {
                    code: promo.code,
                    discountType: promo.discountType,
                    discountValue: promo.discountValue,
                    discountAmount,
                },
            },
        });
    });

    /**
     * GET /api/bookings/my
     * Мої бронювання
     */
    app.get('/my', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user;

        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                master: { select: { displayName: true, photoUrl: true } },
                items: {
                    include: {
                        service: { select: { name: true } },
                        duration: { select: { durationMinutes: true } },
                    },
                },
            },
            orderBy: { bookingDate: 'desc' },
            take: 20,
        });

        return reply.send({
            success: true,
            data: { bookings },
        });
    });

    /**
     * PATCH /api/bookings/:id/status
     * Оновити статус бронювання (наприклад, скасування клієнтом)
     */
    app.patch<{ Params: { id: string }; Body: { status: string; cancelReason?: string } }>(
        '/:id/status',
        { preHandler: [requireAuth] },
        async (request, reply) => {
            const { userId } = request.user;
            const { id } = request.params;
            const { status, cancelReason } = request.body;

            // Validate status
            const validStatuses = ['cancelled_by_client', 'pending_confirmation', 'confirmed'];
            if (!status || !validStatuses.includes(status)) {
                return reply.status(400).send({
                    success: false,
                    error: { message: 'Invalid status', code: 'INVALID_STATUS' },
                });
            }

            // Find booking and verify ownership
            const booking = await prisma.booking.findUnique({
                where: { id },
            });

            if (!booking) {
                return reply.status(404).send({
                    success: false,
                    error: { message: 'Booking not found', code: 'NOT_FOUND' },
                });
            }

            if (booking.userId !== userId) {
                return reply.status(403).send({
                    success: false,
                    error: { message: 'Not authorized', code: 'FORBIDDEN' },
                });
            }

            // Only allow cancellation for certain statuses
            const cancellableStatuses = ['pending_confirmation', 'confirmed', 'deposit_pending'];
            if (status === 'cancelled_by_client' && !cancellableStatuses.includes(booking.status)) {
                return reply.status(400).send({
                    success: false,
                    error: { message: 'Cannot cancel this booking', code: 'INVALID_OPERATION' },
                });
            }

            // Update booking
            const updatedBooking = await prisma.booking.update({
                where: { id },
                data: {
                    status: status as any,
                    cancelReason: cancelReason || null,
                },
                include: {
                    master: { select: { displayName: true, photoUrl: true } },
                    items: {
                        include: {
                            service: { select: { name: true } },
                            duration: { select: { durationMinutes: true } },
                        },
                    },
                },
            });

            return reply.send({
                success: true,
                data: { booking: updatedBooking },
            });
        }
    );
}

/**
 * Генерація вільних часових слотів
 */
function generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    bufferMinutes: number,
    existingBookings: { startTime: string; endTime: string }[]
): string[] {
    const slots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + durationMinutes <= endMinutes) {
        const slotStart = minutesToTime(currentMinutes);
        const slotEnd = minutesToTime(currentMinutes + durationMinutes);

        // Check if slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);
            const slotStartMin = currentMinutes;
            const slotEndMin = currentMinutes + durationMinutes;

            return slotStartMin < bookingEnd + bufferMinutes && slotEndMin > bookingStart - bufferMinutes;
        });

        if (!hasConflict) {
            slots.push(slotStart);
        }

        currentMinutes += 15; // Step: 15 minutes
    }

    return slots;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return minutesToTime(endMinutes);
}
