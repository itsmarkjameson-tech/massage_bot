import { useTranslation } from 'react-i18next';

type LocalizedContent = Record<string, string>;

/**
 * Хук для отримання перекладеного контенту з БД
 * Поля в БД зберігаються як JSON: { "uk": "...", "en": "...", "ru": "..." }
 */
export function useTranslatedContent() {
    const { i18n } = useTranslation();
    const lang = i18n.language as string;

    /**
     * Отримати переклад з JSONB поля
     */
    function t(content: LocalizedContent | null | undefined): string {
        if (!content) return '';
        return content[lang] || content['uk'] || Object.values(content)[0] || '';
    }

    return { t, lang };
}
