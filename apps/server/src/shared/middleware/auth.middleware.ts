import type { FastifyReply, FastifyRequest } from 'fastify';

// UserRole - визначений локально оскільки Prisma клієнт може бути не згенерований
export type UserRole = 'client' | 'master' | 'admin' | 'owner' | 'su';

// Extend Fastify types for JWT
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            userId: string;
            telegramId: number;
            role: UserRole;
        };
        user: {
            userId: string;
            telegramId: number;
            role: UserRole;
        };
    }
}

/**
 * Middleware: вимагає автентифікацію (JWT)
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch {
        reply.status(401).send({
            success: false,
            error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        });
    }
}

/**
 * Middleware factory: вимагає певну роль
 * SU має доступ до всього, що і owner, плюс може редагувати owner
 */
export function requireRole(...roles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        await requireAuth(request, reply);

        if (reply.sent) return; // Already sent 401

        const user = request.user;
        // SU має доступ до всіх ресурсів owner + може редагувати owner
        const effectiveRoles = [...roles];
        if (roles.includes('owner') && !effectiveRoles.includes('su')) {
            effectiveRoles.push('su');
        }
        if (!effectiveRoles.includes(user.role)) {
            reply.status(403).send({
                success: false,
                error: { message: 'Forbidden', code: 'FORBIDDEN' },
            });
        }
    };
}
