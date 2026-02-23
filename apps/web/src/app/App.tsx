import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TelegramProvider } from './providers/TelegramProvider';
import { AppRouter } from './Router';
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

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TelegramProvider>
                <AppRouter />
            </TelegramProvider>
        </QueryClientProvider>
    );
}
