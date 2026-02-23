import { prisma } from '../config/database.js';
import { sendBotMessage } from '../bot/bot.js';
import { formatMessage, Language, MessageTemplateParams } from '../shared/utils/message-templates.js';

/**
 * Інтерфейс для даних відправки сповіщення
 */
export interface SendNotificationData {
    userId: string;
    bookingId?: string;
    type: string;
    language?: string;
    params?: MessageTemplateParams;
}

/**
 * Відправити сповіщення користувачу через Telegram
 */
export async function sendNotification(data: SendNotificationData): Promise<boolean> {
    const { userId, bookingId, type, language = 'uk', params = {} } = data;

    try {
        // Отримати користувача
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramId: true, language: true, firstName: true },
        });

        if (!user) {
            console.error(`User not found: ${userId}`);
            return false;
        }

        const userLanguage = (language || user.language || 'uk') as Language;

        // Форматувати повідомлення
        const messageText = formatMessage(type, userLanguage, {
            client_name: user.firstName || 'друже',
            ...params,
        });

        if (!messageText) {
            console.error(`No template found for type: ${type}`);
            return false;
        }

        // Відправити через бота
        const chatId = Number(user.telegramId);
        await sendBotMessage(chatId, messageText);

        // Записати в базу даних
        await prisma.notification.create({
            data: {
                userId,
                bookingId: bookingId || null,
                type: type as any,
                status: 'sent',
                payload: params as any,
                scheduledAt: new Date(),
                sentAt: new Date(),
            },
        });

        console.log(`✅ Notification sent: ${type} to user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);

        // Записати невдалу спробу в базу
        if (bookingId) {
            await prisma.notification.create({
                data: {
                    userId,
                    bookingId,
                    type: type as any,
                    status: 'failed',
                    payload: params as any,
                    scheduledAt: new Date(),
                },
            });
        }

        return false;
    }
}

/**
 * Записати заплановане сповіщення в базу даних
 */
export async function scheduleNotification(
    userId: string,
    type: string,
    scheduledAt: Date,
    bookingId?: string,
    payload?: Record<string, string>
): Promise<void> {
    await prisma.notification.create({
        data: {
            userId,
            bookingId: bookingId || null,
            type: type as any,
            status: 'pending',
            payload: payload as any,
            scheduledAt,
        },
    });
}

/**
 * Скасувати заплановані сповіщення для бронювання
 */
export async function cancelScheduledNotifications(bookingId: string): Promise<void> {
    await prisma.notification.updateMany({
        where: {
            bookingId,
            status: 'pending',
        },
        data: {
            status: 'failed',
        },
    });
}

/**
 * Отримати список сповіщень користувача
 */
export async function getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
): Promise<{ notifications: any[]; total: number; hasMore: boolean }> {
    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { scheduledAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.notification.count({
            where: { userId },
        }),
    ]);

    return {
        notifications,
        total,
        hasMore: offset + limit < total,
    };
}

/**
 * Відправити тестове сповіщення
 */
export async function sendTestNotification(telegramId: bigint, message: string): Promise<boolean> {
    try {
        await sendBotMessage(Number(telegramId), message);
        return true;
    } catch (error) {
        console.error('Failed to send test notification:', error);
        return false;
    }
}
