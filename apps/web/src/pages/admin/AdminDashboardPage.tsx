import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { GlassCard, GlassCardStatic } from '../../shared/components/ui/GlassCard';
import { SectionHeaderStatic } from '../../shared/components/ui/SectionHeader';
import { api } from '../../shared/api/client';

interface DashboardStats {
    totalUsers: number;
    totalMasters: number;
    totalServices: number;
    totalBookings: number;
    todayBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    avgBookingValue: number;
    monthGrowth: number;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    },
};

const statCardIcons: Record<string, string> = {
    'Всього користувачів': '👥',
    'Активних майстрів': '👤',
    'Послуг': '💆',
    'Всього бронювань': '📅',
    'Бронювань сьогодні': '📆',
    'Очікують підтвердження': '⏳',
    'Завершено': '✅',
    'Середній чек': '💰',
};

const statCardColors: Record<string, string> = {
    'Всього користувачів': 'from-blue-500/30 to-cyan-500/30',
    'Активних майстрів': 'from-green-500/30 to-emerald-500/30',
    'Послуг': 'from-violet-500/30 to-purple-500/30',
    'Всього бронювань': 'from-yellow-500/30 to-orange-500/30',
    'Бронювань сьогодні': 'from-orange-500/30 to-red-500/30',
    'Очікують підтвердження': 'from-red-500/30 to-pink-500/30',
    'Завершено': 'from-teal-500/30 to-green-500/30',
    'Середній чек': 'from-amber-500/30 to-yellow-500/30',
};

export const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get<DashboardStats>('/admin/analytics/overview');
                setStats(data);
            } catch (err) {
                setError('Failed to load dashboard stats');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="glass-card px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-white/80">Завантаження...</span>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="glass-card border-red-500/30 bg-red-500/10 p-6 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { title: 'Всього користувачів', value: stats?.totalUsers || 0 },
        { title: 'Активних майстрів', value: stats?.totalMasters || 0 },
        { title: 'Послуг', value: stats?.totalServices || 0 },
        { title: 'Всього бронювань', value: stats?.totalBookings || 0 },
        { title: 'Бронювань сьогодні', value: stats?.todayBookings || 0 },
        { title: 'Очікують підтвердження', value: stats?.pendingBookings || 0 },
        { title: 'Завершено', value: stats?.completedBookings || 0 },
        { title: 'Середній чек', value: `${Math.round(stats?.avgBookingValue || 0)} ₴` },
    ];

    const quickActions = [
        { href: '/admin/services', icon: '💆', label: 'Управління послугами', color: 'from-violet-500/20 to-purple-500/20', textColor: 'text-violet-300' },
        { href: '/admin/masters', icon: '👤', label: 'Управління майстрами', color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-300' },
        { href: '/admin/bookings', icon: '📅', label: 'Бронювання', color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-300' },
        { href: '/admin/analytics', icon: '📈', label: 'Переглянути аналітику', color: 'from-amber-500/20 to-yellow-500/20', textColor: 'text-amber-300' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <SectionHeaderStatic
                        title="Панель керування"
                        subtitle="Огляд статистики салону"
                        size="lg"
                    />
                </motion.div>

                {/* Revenue Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlassCard variant="gradient" className="p-6 relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                                <div>
                                    <p className="text-white/60 mb-2 text-sm">Дохід за поточний місяць</p>
                                    <p className="text-4xl font-bold gradient-text">
                                        {Math.round(Number(stats?.thisMonthRevenue || 0)).toLocaleString()} ₴
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-white/60 mb-1 text-sm">Зростання</p>
                                        <p className={`text-2xl font-bold ${(stats?.monthGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(stats?.monthGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.monthGrowth || 0).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${(stats?.monthGrowth || 0) >= 0
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {(stats?.monthGrowth || 0) >= 0 ? '📈' : '📉'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {statCards.map((card, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <GlassCardStatic
                                variant="elevated"
                                className="p-5 h-full"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${statCardColors[card.title] || 'from-violet-500/30 to-purple-500/30'}`}>
                                        {statCardIcons[card.title] || '📊'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white/50 mb-1 line-clamp-2">{card.title}</p>
                                        <p className="text-xl font-bold text-white/90">{card.value}</p>
                                    </div>
                                </div>
                            </GlassCardStatic>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <SectionHeaderStatic
                        title="Швидкі дії"
                        size="sm"
                        className="mb-4"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <motion.a
                                key={index}
                                href={action.href}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br ${action.color} border border-white/10 hover:border-white/20 transition-all duration-300 group`}
                            >
                                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</span>
                                <span className={`text-sm font-medium text-center ${action.textColor}`}>{action.label}</span>
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <GlassCardStatic variant="bordered" className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-2xl">
                                💡
                            </div>
                            <div>
                                <h3 className="font-semibold text-white/90 mb-1">Порада</h3>
                                <p className="text-sm text-white/50">
                                    Ви можете переглянути детальну аналітику в розділі "Аналітика" або керувати бронюваннями в розділі "Бронювання".
                                </p>
                            </div>
                        </div>
                    </GlassCardStatic>
                </motion.div>
            </div>
        </AdminLayout>
    );
};
