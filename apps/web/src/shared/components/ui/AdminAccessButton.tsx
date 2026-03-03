import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useIsAdmin, useUserRole } from '../../stores/auth';

interface AdminAccessButtonProps {
    variant?: 'floating' | 'inline';
    className?: string;
}

const pulseAnimation: Variants = {
    initial: {
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
    animate: {
        boxShadow: [
            '0 0 20px rgba(139, 92, 246, 0.3)',
            '0 0 40px rgba(139, 92, 246, 0.6)',
            '0 0 20px rgba(139, 92, 246, 0.3)',
        ],
        transition: {
            duration: 2,
            ease: 'easeInOut' as const,
            repeat: Infinity,
        },
    },
};

const shimmerAnimation: Variants = {
    initial: { x: '-100%' },
    animate: {
        x: '100%',
        transition: {
            duration: 1.5,
            ease: 'easeInOut' as const,
            repeat: Infinity,
            repeatDelay: 1,
        },
    },
};

/**
 * AdminAccessButton - Кнопка доступу до адмін-панелі
 * 
 * Показується виключно для користувачів з ролями: su, owner, admin
 * Підтримує два варіанти:
 * - floating: Кругла FAB кнопка в куті екрану
 * - inline: Для розміщення в профілі або інших секціях
 */
export function AdminAccessButton({
    variant = 'floating',
    className = '',
}: AdminAccessButtonProps) {
    const navigate = useNavigate();
    const isAdmin = useIsAdmin();
    const userRole = useUserRole();

    // Не рендеримо для звичайних користувачів
    if (!isAdmin) {
        return null;
    }

    const handleClick = () => {
        navigate('/admin');
    };

    // Отримуємо відображувану назву ролі
    const getRoleLabel = () => {
        switch (userRole) {
            case 'su':
                return 'Super User';
            case 'owner':
                return 'Owner';
            case 'admin':
                return 'Admin';
            default:
                return 'Admin';
        }
    };

    // Floating FAB варіант
    if (variant === 'floating') {
        return (
            <motion.button
                onClick={handleClick}
                className={`fixed bottom-24 right-4 z-40 group ${className}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Admin Panel"
            >
                {/* Glow Effect Background */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 blur-xl opacity-60"
                    variants={pulseAnimation}
                    initial="initial"
                    animate="animate"
                />

                {/* Button Container */}
                <div className="relative w-14 h-14 rounded-full glass-strong flex items-center justify-center overflow-hidden border border-white/30 shadow-lg">
                    {/* Shimmer Effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        variants={shimmerAnimation}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Icon */}
                    <span className="text-2xl relative z-10">🛡️</span>

                    {/* Lock indicator for extra visibility */}
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center border border-white/30">
                        <span className="text-xs">🔒</span>
                    </div>
                </div>

                {/* Tooltip */}
                <motion.div
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 glass-strong rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: 10 }}
                    whileHover={{ x: 0 }}
                >
                    <span className="text-xs font-medium text-white/90">{getRoleLabel()} Panel</span>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-white/20 border-y-4 border-y-transparent" />
                </motion.div>
            </motion.button>
        );
    }

    // Inline варіант для профілю
    return (
        <motion.button
            onClick={handleClick}
            className={`w-full group ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="relative overflow-hidden rounded-xl glass-bordered p-4 border border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20">
                {/* Shimmer Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    variants={shimmerAnimation}
                    initial="initial"
                    animate="animate"
                />

                <div className="relative z-10 flex items-center gap-4">
                    {/* Icon Container */}
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/80 to-pink-600/80 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <span className="text-2xl">🛡️</span>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-left">
                        <h3 className="font-semibold text-white/90 flex items-center gap-2">
                            Admin Panel
                            <span className="px-2 py-0.5 text-xs bg-violet-500/30 text-violet-300 rounded-full border border-violet-500/30">
                                {getRoleLabel()}
                            </span>
                        </h3>
                        <p className="text-sm text-white/50 mt-0.5">
                            Manage users, bookings, services & analytics
                        </p>
                    </div>

                    {/* Arrow */}
                    <motion.div
                        className="text-white/40 group-hover:text-white/70 transition-colors"
                        whileHover={{ x: 4 }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </motion.div>
                </div>

                {/* Pulse Glow on Hover */}
                <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
            </div>
        </motion.button>
    );
}

/**
 * AdminAccessCard - Окрема картка для адмін доступу
 * Використовується як повноцінна секція в профілі
 */
export function AdminAccessCard({ className = '' }: { className?: string }) {
    const navigate = useNavigate();
    const isAdmin = useIsAdmin();
    const userRole = useUserRole();

    // Debug logging
    console.log('[AdminAccessCard] isAdmin:', isAdmin, 'userRole:', userRole);

    if (!isAdmin) {
        console.log('[AdminAccessCard] Not rendering - user is not admin');
        return null;
    }

    const handleClick = () => {
        navigate('/admin');
    };

    const getRoleBadgeColor = () => {
        switch (userRole) {
            case 'su':
                return 'from-amber-500 to-orange-500';
            case 'owner':
                return 'from-pink-500 to-rose-500';
            case 'admin':
                return 'from-violet-500 to-purple-500';
            default:
                return 'from-violet-500 to-purple-500';
        }
    };

    const getRoleLabel = () => {
        switch (userRole) {
            case 'su':
                return 'Super User';
            case 'owner':
                return 'Owner';
            case 'admin':
                return 'Administrator';
            default:
                return 'Admin';
        }
    };

    return (
        <motion.div
            className={`relative overflow-hidden rounded-2xl ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getRoleBadgeColor()} opacity-10`} />

            {/* Glass Card */}
            <div className="relative glass-card p-5 border border-white/10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleBadgeColor()} flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl">🛡️</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white/90">{getRoleLabel()}</h3>
                            <p className="text-xs text-white/50">Admin Access</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getRoleBadgeColor()} text-white`}>
                        {userRole?.toUpperCase()}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-white/60 mb-4">
                    You have full access to the admin dashboard where you can manage bookings,
                    users, services, masters, and view analytics.
                </p>

                {/* Action Button */}
                <motion.button
                    onClick={handleClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className="text-lg">🛡️</span>
                    Open Admin Dashboard
                    <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                    </svg>
                </motion.button>
            </div>
        </motion.div>
    );
}

export default AdminAccessButton;
