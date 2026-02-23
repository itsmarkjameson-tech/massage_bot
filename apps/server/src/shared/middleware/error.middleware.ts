import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply
) {
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
