import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply
) {
    // Handle ECONNRESET errors gracefully (common on Railway)
    if ((error as any).code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
        console.warn('⚠️ ECONNRESET error handled gracefully (connection reset by peer)');
        return reply.status(503).send({
            success: false,
            error: {
                message: 'Service temporarily unavailable, please retry',
                code: 'ECONNRESET',
            },
        });
    }

    const statusCode = error.statusCode ?? 500;

    reply.status(statusCode).send({
        success: false,
        error: {
            message: error.message,
            code: error.code ?? 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
}
