import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1),

    // Redis
    REDIS_URL: z.string().min(1),

    // Telegram Bot
    BOT_TOKEN: z.string().min(1),
    WEBAPP_URL: z.string().url(),
    BOT_WEBHOOK_URL: z.string().url().optional(),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Portmone Payment
    PORTMONE_PAYEE_ID: z.string().optional(),
    PORTMONE_LOGIN: z.string().optional(),
    PORTMONE_PASSWORD: z.string().optional(),
    PORTMONE_GATEWAY_URL: z.string().optional(),

    // Google Calendar
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().optional(),

    // App
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
