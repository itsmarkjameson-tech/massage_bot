import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { title: 'Всього користувачів', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-100' },
        { title: 'Активних майстрів', value: stats?.totalMasters || 0, icon: '👤', color: 'bg-green-100' },
        { title: 'Послуг', value: stats?.totalServices || 0, icon: '💆', color: 'bg-purple-100' },
        { title: 'Всього бронювань', value: stats?.totalBookings || 0, icon: '📅', color: 'bg-yellow-100' },
        { title: 'Бронювань сьогодні', value: stats?.todayBookings || 0, icon: '📆', color: 'bg-orange-100' },
        { title: 'Очікують підтвердження', value: stats?.pendingBookings || 0, icon: '⏳', color: 'bg-red-100' },
        { title: 'Завершено', value: stats?.completedBookings || 0, icon: '✅', color: 'bg-teal-100' },
        { title: 'Середній чек', value: `${Math.round(stats?.avgBookingValue || 0)} ₴`, icon: '💰', color: 'bg-yellow-100' },
    ];

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Панель керування</h1>
                <p className="text-gray-600">Огляд статистики салону</p>
            </div>

            {/* Revenue Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-purple-200 mb-1">Дохід за поточний місяць</p>
                        <p className="text-3xl font-bold">{Math.round(Number(stats?.thisMonthRevenue || 0)).toLocaleString()} ₴</p>
                    </div>
                    <div className="text-right">
                        <p className="text-purple-200 mb-1">Зростання</p>
                        <p className={`text-2xl font-bold ${(stats?.monthGrowth || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {(stats?.monthGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.monthGrowth || 0).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl mr-4`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{card.title}</p>
                                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Швидкі дії</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/admin/services" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <span className="text-2xl mb-2">💆</span>
                        <span className="text-sm font-medium text-purple-700">Управління послугами</span>
                    </a>
                    <a href="/admin/masters" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <span className="text-2xl mb-2">👤</span>
                        <span className="text-sm font-medium text-green-700">Управління майстрами</span>
                    </a>
                    <a href="/admin/bookings" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <span className="text-2xl mb-2">📅</span>
                        <span className="text-sm font-medium text-blue-700">Бронювання</span>
                    </a>
                    <a href="/admin/analytics" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                        <span className="text-2xl mb-2">📈</span>
                        <span className="text-sm font-medium text-yellow-700">Переглянути аналітику</span>
                    </a>
                </div>
            </div>
        </AdminLayout>
    );
};
