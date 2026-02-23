import { Bot, InlineKeyboard } from 'grammy';
import { env } from '../config/env.js';

export const bot = new Bot(env.BOT_TOKEN);

/**
 * Встановити webhook для Telegram бота в production
 */
export async function setWebhook(url: string) {
    try {
        await bot.api.setWebhook(url);
        console.log(`✅ Webhook set to: ${url}`);
    } catch (error) {
        console.error('Failed to set webhook:', error);
    }
}

export async function initBot() {
    // /start command
    bot.command('start', async (ctx) => {
        const firstName = ctx.from?.first_name ?? 'друже';

        const keyboard = new InlineKeyboard().webApp(
            '🧖 Увійти в додаток',
            env.WEBAPP_URL
        );

        await ctx.reply(
            `Привіт, ${firstName}! 👋\n\n` +
            `Ласкаво просимо до нашого масажного салону! 💆‍♀️\n\n` +
            `Тут ви можете:\n` +
            `✅ Переглянути наші послуги\n` +
            `✅ Записатися до майстра\n` +
            `✅ Керувати своїми записами\n` +
            `✅ Отримувати нагадування\n\n` +
            `Натисніть кнопку нижче, щоб відкрити додаток:`,
            { reply_markup: keyboard }
        );
    });

    // Handle errors
    bot.catch((err) => {
        console.error('Bot error:', err);
    });

    // Start bot (long polling for development, webhook for production)
    if (env.NODE_ENV === 'development') {
        bot.start();
    } else {
        // In production, use webhook setup via Fastify route
        // This will be configured in the Fastify app
    }
}

/**
 * Відправити повідомлення користувачу через бота
 */
export async function sendBotMessage(
    chatId: number | string,
    text: string,
    options?: {
        parseMode?: 'HTML' | 'MarkdownV2';
        replyMarkup?: InlineKeyboard;
    }
) {
    try {
        await bot.api.sendMessage(chatId, text, {
            parse_mode: options?.parseMode ?? 'HTML',
            reply_markup: options?.replyMarkup,
        });
    } catch (error) {
        console.error(`Failed to send message to ${chatId}:`, error);
    }
}
