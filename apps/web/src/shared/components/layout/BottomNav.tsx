import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIsAdmin } from '../../stores/auth';

const navItems = [
    { path: '/', icon: '🏠', labelKey: 'nav.home' },
    { path: '/booking', icon: '📅', labelKey: 'nav.booking' },
    { path: '/waitlist', icon: '🔔', labelKey: 'nav.waitlist' },
    { path: '/profile', icon: '👤', labelKey: 'nav.profile' },
];

const adminNavItem = { path: '/admin', icon: '🛡️', labelKey: 'nav.admin' };

export function BottomNav() {
    const { t } = useTranslation();
    const isAdmin = useIsAdmin();

    // Додаємо Admin tab для адміністраторів
    const items = isAdmin
        ? [...navItems.slice(0, 3), adminNavItem, navItems[3]]
        : navItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 glass-dark backdrop-blur-xl border-t border-white/10" />

            {/* Gradient Glow Effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className={`relative flex items-center justify-around h-16 mx-auto px-4 ${isAdmin ? 'max-w-xl' : 'max-w-lg'}`}>
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${isActive
                                ? 'text-white'
                                : 'text-white/50 hover:text-white/80'
                            } ${item.path === '/admin' ? 'text-amber-400' : ''}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active Background Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNavBg"
                                        className={`absolute inset-0 bg-gradient-to-tr rounded-xl border border-white/10 ${item.path === '/admin'
                                                ? 'from-amber-600/30 to-orange-500/30'
                                                : 'from-violet-600/30 to-pink-500/30'
                                            }`}
                                        initial={false}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 35,
                                        }}
                                    />
                                )}

                                {/* Icon Container */}
                                <motion.div
                                    className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl"
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -4 : 0,
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    }}
                                >
                                    {/* Glow effect for active item */}
                                    {isActive && (
                                        <motion.div
                                            className={`absolute inset-0 rounded-xl blur-md ${item.path === '/admin'
                                                    ? 'bg-gradient-to-tr from-amber-500/20 to-orange-500/20'
                                                    : 'bg-gradient-to-tr from-violet-500/20 to-pink-500/20'
                                                }`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1.2 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}

                                    <span className="relative z-10 text-xl">
                                        {item.icon}
                                    </span>
                                </motion.div>

                                {/* Label */}
                                <motion.span
                                    className={`relative z-10 text-xs font-medium transition-all duration-300 ${isActive ? 'text-white' : ''} ${item.path === '/admin' && !isActive ? 'text-amber-400/70' : ''
                                        }`}
                                    animate={{
                                        opacity: isActive ? 1 : 0.7,
                                    }}
                                >
                                    {t(item.labelKey)}
                                </motion.span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
