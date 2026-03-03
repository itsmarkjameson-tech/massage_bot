import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface GradientButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    shimmer?: boolean;
}

const buttonVariants: Variants = {
    rest: {
        scale: 1,
        boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
    },
    hover: {
        scale: 1.02,
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 17,
        },
    },
    tap: {
        scale: 0.98,
        transition: {
            duration: 0.1,
        },
    },
};

const shimmerVariants: Variants = {
    initial: {
        x: '-100%',
    },
    animate: {
        x: '100%',
        transition: {
            duration: 0.6,
            ease: 'easeInOut' as const,
        },
    },
};

export function GradientButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    disabled,
    loading,
    type = 'button',
    shimmer = true,
}: GradientButtonProps) {
    const baseStyles = 'relative overflow-hidden font-medium rounded-xl transition-all flex items-center justify-center gap-2';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25',
        secondary: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 text-white shadow-lg shadow-blue-500/25',
        ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
        glass: 'glass-button text-white',
    };

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const isDisabled = disabled || loading;

    return (
        <motion.button
            type={type}
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            variants={buttonVariants}
            initial="rest"
            whileHover={isDisabled ? undefined : 'hover'}
            whileTap={isDisabled ? undefined : 'tap'}
            onClick={onClick}
            disabled={isDisabled}
        >
            {/* Shimmer Effect */}
            {!isDisabled && shimmer && variant !== 'ghost' && (
                <motion.div
                    className="absolute inset-0 opacity-0 hover:opacity-100 pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                    variants={shimmerVariants}
                    initial="initial"
                    whileHover="animate"
                />
            )}

            {loading ? (
                <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Завантаження...</span>
                </span>
            ) : (
                children
            )}
        </motion.button>
    );
}

// Simple gradient button without motion for static use cases
export function GradientButtonStatic({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    disabled,
    loading,
    type = 'button',
}: GradientButtonProps) {
    const baseStyles = 'relative overflow-hidden font-medium rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40',
        secondary: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
        ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
        glass: 'glass-button text-white hover:brightness-110',
    };

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}
            `}
            onClick={onClick}
            disabled={isDisabled}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Завантаження...</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
}