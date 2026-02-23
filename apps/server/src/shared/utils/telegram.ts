import crypto from 'node:crypto';
import { env } from '../../config/env.js';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

interface ParsedInitData {
    user: TelegramUser;
    authDate: number;
    hash: string;
    queryId?: string;
}

/**
 * Валідація Telegram WebApp initData
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): ParsedInitData {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
        throw new Error('Missing hash in initData');
    }

    // Remove hash from params for validation
    params.delete('hash');

    // Sort params alphabetically and create data-check-string
    const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    // Create secret key
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(env.BOT_TOKEN)
        .digest();

    // Calculate hash
    const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (calculatedHash !== hash) {
        throw new Error('Invalid initData hash');
    }

    // Check auth_date (not older than 24 hours)
    const authDate = parseInt(params.get('auth_date') ?? '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
        throw new Error('InitData is expired');
    }

    // Parse user data
    const userStr = params.get('user');
    if (!userStr) {
        throw new Error('Missing user in initData');
    }

    const user: TelegramUser = JSON.parse(userStr);

    return {
        user,
        authDate,
        hash,
        queryId: params.get('query_id') ?? undefined,
    };
}
