import { motion, Variants } from 'framer-motion';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    align?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    animate?: boolean;
    delay?: number;
}

const containerVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    },
};

export function SectionHeader({
    title,
    subtitle,
    align = 'left',
    size = 'md',
    className = '',
    animate = true,
    delay = 0,
}: SectionHeaderProps) {
    const alignStyles = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    const titleSizes = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl md:text-5xl',
    };

    const subtitleSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    if (animate) {
        return (
            <motion.div
                className={`${alignStyles[align]} mb-8 ${className}`}
                variants={containerVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay }}
            >
                <h2
                    className={`
                        ${titleSizes[size]} font-bold mb-3
                        bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400
                        bg-clip-text text-transparent
                    `}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p className={`${subtitleSizes[size]} text-white/60`}>
                        {subtitle}
                    </p>
                )}
            </motion.div>
        );
    }

    return (
        <div className={`${alignStyles[align]} mb-8 ${className}`}>
            <h2
                className={`
                    ${titleSizes[size]} font-bold mb-3
                    bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400
                    bg-clip-text text-transparent
                `}
            >
                {title}
            </h2>
            {subtitle && (
                <p className={`${subtitleSizes[size]} text-white/60`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

// Static version without animation
export function SectionHeaderStatic({
    title,
    subtitle,
    align = 'left',
    size = 'md',
    className = '',
}: Omit<SectionHeaderProps, 'animate' | 'delay'>) {
    const alignStyles = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    const titleSizes = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl md:text-5xl',
    };

    const subtitleSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    return (
        <div className={`${alignStyles[align]} mb-8 ${className}`}>
            <h2
                className={`
                    ${titleSizes[size]} font-bold mb-3
                    bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400
                    bg-clip-text text-transparent
                `}
            >
                {title}
            </h2>
            {subtitle && (
                <p className={`${subtitleSizes[size]} text-white/60`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}