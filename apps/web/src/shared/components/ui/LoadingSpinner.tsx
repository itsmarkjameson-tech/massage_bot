import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md', className = '', fullScreen = false }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
            <motion.div
                className={`${sizeClasses[size]} border-2 border-[var(--color-primary)] border-t-transparent rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

// Skeleton loader component
interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-[var(--color-secondary-bg)] rounded-lg ${className}`}
        />
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="bg-[var(--color-secondary-bg)] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    );
}

// List skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}
