import { buildApp } from './app.js';
import { env } from './config/env.js';
import { initBot, setWebhook } from './bot/bot.js';
import { prisma } from './config/database.js';

async function main() {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('✅ Database connected');

        // Build Fastify app
        const app = await buildApp();

        // Initialize Telegram Bot
        await initBot();
        if (env.NODE_ENV === 'development') {
            console.log('✅ Telegram Bot started (long polling)');
        } else if (env.BOT_WEBHOOK_URL) {
            await setWebhook(env.BOT_WEBHOOK_URL + '/webhook');
            console.log('✅ Telegram Bot webhook configured');
        }

        // Start server
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Global error handlers for uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, let the app continue running
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Graceful shutdown on uncaught exception
    prisma.$disconnect().finally(() => {
        process.exit(1);
    });
});

// Handle ECONNRESET specifically
process.on('error', (error: any) => {
    if (error.code === 'ECONNRESET') {
        console.warn('⚠️ Connection reset error (expected on Railway):', error.message);
    } else {
        console.error('Process error:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

main();
