import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
    { path: '/', icon: '🏠', labelKey: 'nav.home' },
    { path: '/booking', icon: '📅', labelKey: 'nav.booking' },
    { path: '/waitlist', icon: '🔔', labelKey: 'nav.waitlist' },
    { path: '/profile', icon: '👤', labelKey: 'nav.profile' },
];

export function BottomNav() {
    const { t } = useTranslation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--color-bg)] border-[var(--color-hint)]/20">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${isActive
                                ? 'text-[var(--color-btn)]'
                                : 'text-[var(--color-hint)]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <motion.span
                                    className="text-xl"
                                    animate={{ scale: isActive ? 1.15 : 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    {item.icon}
                                </motion.span>
                                <span className="text-xs font-medium">{t(item.labelKey)}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
