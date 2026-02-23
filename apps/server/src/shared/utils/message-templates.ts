/**
 * Шаблони повідомлень для різних типів сповіщень
 * Підтримує мови: uk, en, ru
 * Плейсхолдери: {client_name}, {master_name}, {service_name}, {date}, {time}
 */

export type Language = 'uk' | 'en' | 'ru';

export interface MessageTemplateParams {
    client_name?: string;
    master_name?: string;
    service_name?: string;
    date?: string;
    time?: string;
    price?: string;
    duration?: string;
    booking_id?: string;
    promo_code?: string;
    discount?: string;
}

// Шаблони для кожного типу сповіщення
const templates: Record<string, Record<Language, string>> = {
    // ============================================
    // BOOKING NOTIFICATIONS
    // ============================================

    booking_created: {
        uk: `🗓 <b>Бронювання створено!</b>\n\n` +
            `Дякуємо, {client_name}! Ваше бронювання очікує підтвердження.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n` +
            `👤 Майстер: {master_name}\n` +
            `💆 Послуга: {service_name}\n\n` +
            `Ми повідомимо вас, коли майстер підтвердить запис.`,

        en: `🗓 <b>Booking Created!</b>\n\n` +
            `Thank you, {client_name}! Your booking is pending confirmation.\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n` +
            `👤 Master: {master_name}\n` +
            `💆 Service: {service_name}\n\n` +
            `We will notify you when the master confirms your appointment.`,

        ru: `🗓 <b>Бронирование создано!</b>\n\n` +
            `Спасибо, {client_name}! Ваше бронирование ожидает подтверждения.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n` +
            `👤 Мастер: {master_name}\n` +
            `💆 Услуга: {service_name}\n\n` +
            `Мы уведомим вас, когда мастер подтвердит запись.`,
    },

    booking_confirmed: {
        uk: `✅ <b>Бронювання підтверджено!</b>\n\n` +
            `Відмінні новини, {client_name}! Ваше бронювання підтверджено.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n` +
            `👤 Майстер: {master_name}\n` +
            `💆 Послуга: {service_name}\n\n` +
            `До зустрічі! 💆‍♀️`,

        en: `✅ <b>Booking Confirmed!</b>\n\n` +
            `Great news, {client_name}! Your booking has been confirmed.\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n` +
            `👤 Master: {master_name}\n` +
            `💆 Service: {service_name}\n\n` +
            `See you soon! 💆‍♀️`,

        ru: `✅ <b>Бронирование подтверждено!</b>\n\n` +
            `Отличные новости, {client_name}! Ваше бронирование подтверждено.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n` +
            `👤 Мастер: {master_name}\n` +
            `💆 Услуга: {service_name}\n\n` +
            `До встречи! 💆‍♀️`,
    },

    booking_cancelled: {
        uk: `❌ <b>Бронювання скасовано</b>\n\n` +
            `На жаль, {client_name}, ваше бронювання було скасовано.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n\n` +
            `Якщо ви не скасовували бронювання, зв'яжіться з нами.`,

        en: `❌ <b>Booking Cancelled</b>\n\n` +
            `Sorry, {client_name}, your booking has been cancelled.\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n\n` +
            `If you did not cancel, please contact us.`,

        ru: `❌ <b>Бронирование отменено</b>\n\n` +
            `К сожалению, {client_name}, ваше бронирование было отменено.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n\n` +
            `Если вы не отменяли бронирование, свяжитесь с нами.`,
    },

    // ============================================
    // REMINDERS
    // ============================================

    reminder_24h: {
        uk: `⏰ <b>Нагадування за 24 години</b>\n\n` +
            `Привіт, {client_name}! Нагадуємо про ваш візит завтра.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n` +
            `👤 Майстер: {master_name}\n` +
            `💆 Послуга: {service_name}\n\n` +
            `Чекаємо на вас! 💆‍♀️`,

        en: `⏰ <b>24-Hour Reminder</b>\n\n` +
            `Hi, {client_name}! Just a reminder about your appointment tomorrow.\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n` +
            `👤 Master: {master_name}\n` +
            `💆 Service: {service_name}\n\n` +
            `We look forward to seeing you! 💆‍♀️`,

        ru: `⏰ <b>Напоминание за 24 часа</b>\n\n` +
            `Привет, {client_name}! Напоминаем о вашем визите завтра.\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n` +
            `👤 Мастер: {master_name}\n` +
            `💆 Услуга: {service_name}\n\n` +
            `Ждем вас! 💆‍♀️`,
    },

    reminder_2h: {
        uk: `⏰ <b>Нагадування за 2 години</b>\n\n` +
            `{client_name}, через 2 години у вас візит до масажного салону!\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n` +
            `👤 Майстер: {master_name}\n\n` +
            `Поспішайте! 💆‍♀️`,

        en: `⏰ <b>2-Hour Reminder</b>\n\n` +
            `{client_name}, you have an appointment in 2 hours!\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n` +
            `👤 Master: {master_name}\n\n` +
            `Hurry up! 💆‍♀️`,

        ru: `⏰ <b>Напоминание за 2 часа</b>\n\n` +
            `{client_name}, через 2 часа у вас визит в массажный салон!\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n` +
            `👤 Мастер: {master_name}\n\n` +
            `Спешите! 💆‍♀️`,
    },

    // ============================================
    // REVIEW REQUEST
    // ============================================

    review_request: {
        uk: `⭐ <b>Як вам візит?</b>\n\n` +
            `Привіт, {client_name}! Дякуємо за візит до нашого салону.\n\n` +
            `Будь ласка, оцініть ваш досвід:\n` +
            `👤 Майстер: {master_name}\n` +
            `📅 Дата: {date}\n\n` +
            `Ваш відгук допоможе нам стати краще! 💆‍♀️`,

        en: `⭐ <b>How was your visit?</b>\n\n` +
            `Hi, {client_name}! Thank you for visiting our salon.\n\n` +
            `Please rate your experience:\n` +
            `👤 Master: {master_name}\n` +
            `📅 Date: {date}\n\n` +
            `Your feedback helps us improve! 💆‍♀️`,

        ru: `⭐ <b>Как вам визит?</b>\n\n` +
            `Привет, {client_name}! Спасибо за визит в наш салон.\n\n` +
            `Пожалуйста, оцените ваш опыт:\n` +
            `👤 Мастер: {master_name}\n` +
            `📅 Дата: {date}\n\n` +
            `Ваш отзыв поможет нам стать лучше! 💆‍♀️`,
    },

    // ============================================
    // PROMOTIONS
    // ============================================

    promotion: {
        uk: `🎁 <b>Акція!</b>\n\n` +
            `{client_name}, спеціальна пропозиція для вас!\n\n` +
            `{promo_code}\n\n` +
            `Поспішайте, акція діє до {date}!`,

        en: `🎁 <b>Special Offer!</b>\n\n` +
            `{client_name}, a special offer for you!\n\n` +
            `{promo_code}\n\n` +
            `Hurry, the offer is valid until {date}!`,

        ru: `🎁 <b>Акция!</b>\n\n` +
            `{client_name}, специальное предложение для вас!\n\n` +
            `{promo_code}\n\n` +
            `Спешите, акция действует до {date}!`,
    },

    // ============================================
    // DAILY SCHEDULE
    // ============================================

    schedule_daily: {
        uk: `📋 <b>Розклад на сьогодні</b>\n\n` +
            `{client_name}, ось ваші заплановані візити:\n\n` +
            `{date}\n\n` +
            `Чекаємо на вас! 💆‍♀️`,

        en: `📋 <b>Today's Schedule</b>\n\n` +
            `{client_name}, here are your scheduled appointments:\n\n` +
            `{date}\n\n` +
            `We look forward to seeing you! 💆‍♀️`,

        ru: `📋 <b>Расписание на сегодня</b>\n\n` +
            `{client_name}, вот ваши запланированные визиты:\n\n` +
            `{date}\n\n` +
            `Ждем вас! 💆‍♀️`,
    },

    // ============================================
    // WAITLIST
    // ============================================

    waitlist_available: {
        uk: `🎉 <b>Місце звільнилося!</b>\n\n` +
            `{client_name}, чудові новини! З'явилося вільне місце для послуги "{service_name}".\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Час: {time}\n\n` +
            `Поспішайте записатися!`,

        en: `🎉 <b>Spot Available!</b>\n\n` +
            `{client_name}, great news! A spot has opened up for "{service_name}".\n\n` +
            `📅 Date: {date}\n` +
            `⏰ Time: {time}\n\n` +
            `Book now before it's gone!`,

        ru: `🎉 <b>Место освободилось!</b>\n\n` +
            `{client_name}, отличные новости! Появилось свободное место для услуги "{service_name}".\n\n` +
            `📅 Дата: {date}\n` +
            `⏰ Время: {time}\n\n` +
            `Спешите записаться!`,
    },
};

/**
 * Отримати текст повідомлення для вказаного типу та мови
 */
export function getMessageTemplate(
    type: string,
    language: Language = 'uk'
): string {
    const langTemplates = templates[type];
    if (!langTemplates) {
        console.warn(`No template found for notification type: ${type}`);
        return '';
    }
    return langTemplates[language] || langTemplates.uk;
}

/**
 * Замінити плейсхолдери в шаблоні на реальні значення
 */
export function fillTemplate(
    template: string,
    params: MessageTemplateParams
): string {
    let result = template;

    for (const [key, value] of Object.entries(params)) {
        const placeholder = `{${key}}`;
        result = result.split(placeholder).join(value || '');
    }

    return result;
}

/**
 * Сформувати повідомлення з шаблону
 */
export function formatMessage(
    type: string,
    language: Language,
    params: MessageTemplateParams
): string {
    const template = getMessageTemplate(type, language);
    return fillTemplate(template, params);
}

/**
 * Отримати список доступних типів повідомлень
 */
export function getAvailableTypes(): string[] {
    return Object.keys(templates);
}
