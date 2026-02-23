import { useState, useEffect } from 'react';
import { api } from '../../shared/api/client';

interface DashboardStats {
    todayBookings: number;
    weekBookings: number;
    monthBookings: number;
    todayIncome: number;
    weekIncome: number;
    monthIncome: number;
    totalClients: number;
    averageRating: number;
    reviewCount: number;
}

export function MasterDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await api.get<{ stats: DashboardStats }>('/master/dashboard');
            setStats(data.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Панель майстра</h1>
                <span className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('uk-UA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </span>
            </div>

            {/* Today's Stats */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <h2 className="text-lg font-semibold mb-4">Сьогодні</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-3xl font-bold">{stats?.todayBookings || 0}</div>
                        <div className="text-sm text-white/80">Записів</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-3xl font-bold">{stats?.todayIncome || 0} ₴</div>
                        <div className="text-sm text-white/80">Дохід</div>
                    </div>
                </div>
            </div>

            {/* Week Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Цей тиждень</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{stats?.weekBookings || 0}</div>
                        <div className="text-sm text-gray-500">Записів</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{stats?.weekIncome || 0} ₴</div>
                        <div className="text-sm text-gray-500">Дохід</div>
                    </div>
                </div>
            </div>

            {/* Month Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Цей місяць</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{stats?.monthBookings || 0}</div>
                        <div className="text-sm text-gray-500">Записів</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{stats?.monthIncome || 0} ₴</div>
                        <div className="text-sm text-gray-500">Дохід</div>
                    </div>
                </div>
            </div>

            {/* Clients & Rating */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="text-3xl font-bold text-purple-600">{stats?.totalClients || 0}</div>
                    <div className="text-sm text-gray-500 mt-1">Всього клієнтів</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-yellow-500">{stats?.averageRating || 0}</span>
                        <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{stats?.reviewCount || 0} відгуків</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Швидкі дії</h2>
                <div className="grid grid-cols-2 gap-3">
                    <a
                        href="/master/schedule"
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Розклад</div>
                            <div className="text-xs text-gray-500">Керувати</div>
                        </div>
                    </a>
                    <a
                        href="/master/bookings"
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Записи</div>
                            <div className="text-xs text-gray-500">Переглянути</div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
