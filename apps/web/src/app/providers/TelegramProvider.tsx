import { useEffect, useState, useContext, createContext, type ReactNode } from 'react';
import { initLanguageFromTelegram } from '../../shared/i18n/config';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface TelegramContextValue {
    user: TelegramUser | null;
    tg: any;
}

const TelegramContext = createContext<TelegramContextValue>({
    user: null,
    tg: null,
});

export function useTelegram() {
    return useContext(TelegramContext);
}

interface TelegramProviderProps {
    children: ReactNode;
}

/**
 * Провайдер для ініціалізації Telegram WebApp SDK
 */
export function TelegramProvider({ children }: TelegramProviderProps) {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [tg, setTg] = useState<any>(null);

    useEffect(() => {
        const telegram = (window as any).Telegram?.WebApp;

        if (telegram) {
            // Expand the app to full height
            telegram.expand();

            // Enable closing confirmation
            telegram.enableClosingConfirmation();

            // Set header color to match theme
            telegram.setHeaderColor('secondary_bg_color');

            // Ready signal
            telegram.ready();

            setTg(telegram);

            // Get user data
            if (telegram.initDataUnsafe?.user) {
                setUser(telegram.initDataUnsafe.user);
            }
        }

        // Init language from Telegram user settings
        initLanguageFromTelegram();
    }, []);

    return (
        <TelegramContext.Provider value={{ user, tg }}>
            {children}
        </TelegramContext.Provider>
    );
}
