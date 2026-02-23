import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uk from './locales/uk.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const resources = {
    uk: { translation: uk },
    en: { translation: en },
    ru: { translation: ru },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'uk',
        supportedLngs: ['uk', 'en', 'ru'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

/**
 * Ініціалізація мови з Telegram WebApp
 */
export function initLanguageFromTelegram() {
    try {
        const tg = (window as any).Telegram?.WebApp;
        const langCode = tg?.initDataUnsafe?.user?.language_code;

        if (langCode) {
            const supportedLang = ['uk', 'en', 'ru'].includes(langCode) ? langCode : 'uk';
            // Only set if user hasn't manually chosen a language
            if (!localStorage.getItem('i18nextLng')) {
                i18n.changeLanguage(supportedLang);
            }
        }
    } catch {
        // Fallback to default
    }
}

export default i18n;
