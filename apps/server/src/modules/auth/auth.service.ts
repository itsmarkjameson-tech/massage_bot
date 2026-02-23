import { prisma } from '../../config/database.js';
import { validateInitData } from '../../shared/utils/telegram.js';

export class AuthService {
    /**
     * Автентифікація через Telegram initData
     * Створює користувача якщо не існує, або повертає існуючого
     */
    async authenticateWithTelegram(initData: string) {
        const { user: tgUser } = validateInitData(initData);

        // Find or create user
        const user = await prisma.user.upsert({
            where: { telegramId: BigInt(tgUser.id) },
            update: {
                telegramUsername: tgUser.username ?? null,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name ?? null,
                avatarUrl: tgUser.photo_url ?? null,
                // Update language only if user hasn't set it manually
            },
            create: {
                telegramId: BigInt(tgUser.id),
                telegramUsername: tgUser.username ?? null,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name ?? null,
                avatarUrl: tgUser.photo_url ?? null,
                language: tgUser.language_code === 'ru' ? 'ru' : tgUser.language_code === 'en' ? 'en' : 'uk',
            },
        });

        return {
            userId: user.id,
            telegramId: Number(user.telegramId),
            role: user.role,
            profile: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                telegramUsername: user.telegramUsername,
                avatarUrl: user.avatarUrl,
                role: user.role,
                language: user.language,
            },
        };
    }
}

export const authService = new AuthService();
