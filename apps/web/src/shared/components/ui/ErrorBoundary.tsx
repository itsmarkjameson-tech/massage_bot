import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center"
                >
                    <div className="text-5xl mb-4">😵</div>
                    <h2 className="text-xl font-bold mb-2">Упс! Щось пішло не так</h2>
                    <p className="text-[var(--color-hint)] mb-4">
                        {this.state.error?.message || 'Сталася неочікувана помилка'}
                    </p>
                    <motion.button
                        onClick={this.handleRetry}
                        className="px-6 py-3 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-semibold"
                        whileTap={{ scale: 0.97 }}
                    >
                        Спробувати знову
                    </motion.button>
                </motion.div>
            );
        }

        return this.props.children;
    }
}

// Error message component for inline errors
interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl"
        >
            <div className="flex items-center gap-2 text-red-700">
                <span>⚠️</span>
                <span>{message}</span>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-sm text-red-600 underline"
                >
                    Спробувати знову
                </button>
            )}
        </motion.div>
    );
}

// Empty state component
interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-[var(--color-hint)] mb-4 max-w-xs">{description}</p>
            )}
            {action && (
                <motion.button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-semibold"
                    whileTap={{ scale: 0.97 }}
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
}
