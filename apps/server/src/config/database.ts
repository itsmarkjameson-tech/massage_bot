import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        // Connection pool settings for Railway stability
        // Prevents ECONNRESET by managing connection lifecycle
    });

// Handle connection-level errors
prisma.$on('error' as any, (e: any) => {
    console.error('Prisma connection error:', e);
});

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Fastify plugin for Prisma client
 * Exposes prisma as decorator on fastify instance
 */
async function prismaPluginFn(fastify: any) {
    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
}

export const prismaPlugin = fp(prismaPluginFn, {
    name: 'prismaPlugin',
    fastify: '5.x',
});
