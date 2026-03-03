import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'bordered' | 'gradient' | 'float';
    hover?: boolean;
    onClick?: () => void;
    animate?: boolean;
    delay?: number;
}

const cardVariants = {
    initial: {
        opacity: 0,
        y: 30,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    },
};

const hoverVariants = {
    rest: {
        y: 0,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    },
    hover: {
        y: -8,
        boxShadow: '0 20px 40px 0 rgba(31, 38, 135, 0.25)',
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 20,
        },
    },
};

export function GlassCard({
    children,
    className = '',
    variant = 'default',
    hover = true,
    onClick,
    animate = true,
    delay = 0,
}: GlassCardProps) {
    const variantStyles = {
        default: 'glass-card',
        elevated: 'glass-card shadow-premium',
        bordered: 'glass-bordered',
        gradient: 'glass-card bg-gradient-to-br from-white/10 to-white/5',
        float: 'glass-float',
    };

    const Component = animate ? motion.div : 'div';

    const animationProps = animate
        ? {
            variants: cardVariants,
            initial: 'initial',
            whileInView: 'animate',
            viewport: { once: true },
            transition: { delay },
        }
        : {};

    const hoverProps = hover && animate
        ? {
            whileHover: 'hover',
            initial: 'rest',
            animate: 'rest',
        }
        : {};

    return (
        <Component
            className={`${variantStyles[variant]} ${className} relative overflow-hidden`}
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
            {...animationProps}
            {...hoverProps}
        >
            {hover && animate && (
                <motion.div
                    variants={hoverVariants}
                    className="absolute inset-0 rounded-[inherit] pointer-events-none"
                />
            )}
            <div className="relative z-10">{children}</div>
        </Component>
    );
}

// Simpler static version for cases where motion isn't needed
export function GlassCardStatic({
    children,
    className = '',
    variant = 'default',
    onClick,
}: Omit<GlassCardProps, 'hover' | 'animate' | 'delay'>) {
    const variantStyles = {
        default: 'glass-card',
        elevated: 'glass-card shadow-premium',
        bordered: 'glass-bordered',
        gradient: 'glass-card bg-gradient-to-br from-white/10 to-white/5',
        float: 'glass-float',
    };

    return (
        <div
            className={`${variantStyles[variant]} ${className} relative overflow-hidden transition-all duration-300 hover-lift`}
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
}