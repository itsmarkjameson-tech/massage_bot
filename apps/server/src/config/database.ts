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
    });

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Fastify plugin for Prisma client
 * Exposes prisma as decorator on fastify instance
 */
async function prismaPlugin(fastify: any) {
    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
}

export const prismaPlugin = fp(prismaPlugin, {
    name: 'prismaPlugin',
    fastify: '4.x',
});
