import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TelegramProvider } from './providers/TelegramProvider';
import { AppRouter } from './Router';
import { useAuthStore } from '../shared/stores/auth';
import '../shared/i18n/config';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

function AuthInitializer() {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return null;
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TelegramProvider>
                <AuthInitializer />
                <AppRouter />
            </TelegramProvider>
        </QueryClientProvider>
    );
}
