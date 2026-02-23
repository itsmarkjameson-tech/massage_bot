import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';

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
 */
export function requireRole(...roles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        await requireAuth(request, reply);

        if (reply.sent) return; // Already sent 401

        const user = request.user;
        if (!roles.includes(user.role)) {
            reply.status(403).send({
                success: false,
                error: { message: 'Forbidden', code: 'FORBIDDEN' },
            });
        }
    };
}
