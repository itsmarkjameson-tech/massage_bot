import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface OverviewStats {
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

interface RevenueData {
    totalRevenue: number;
    totalDiscount: number;
    revenueByDay: { date: string; revenue: number }[];
}

export const AdminAnalyticsPage: React.FC = () => {
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [overviewData, revenueData] = await Promise.all([
                    api.get<OverviewStats>('/admin/analytics/overview'),
                    api.get<RevenueData>('/admin/analytics/revenue'),
                ]);
                setOverview(overviewData);
                setRevenue(revenueData);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">Detailed business analytics</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(Number(overview?.totalRevenue || 0)).toLocaleString()} UAH</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(Number(overview?.thisMonthRevenue || 0)).toLocaleString()} UAH</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(overview?.avgBookingValue || 0)} UAH</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Month Growth</p>
                    <p className={`text-2xl font-bold ${(overview?.monthGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(overview?.monthGrowth || 0) >= 0 ? '+' : ''}{Math.round(overview?.monthGrowth || 0)}%
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Users</p>
                    <p className="text-xl font-bold">{overview?.totalUsers || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Masters</p>
                    <p className="text-xl font-bold">{overview?.totalMasters || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Services</p>
                    <p className="text-xl font-bold">{overview?.totalServices || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-xl font-bold">{overview?.totalBookings || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="text-xl font-bold">{overview?.todayBookings || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-xl font-bold">{overview?.pendingBookings || 0}</p>
                </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Revenue by Day</h2>
                {revenue?.revenueByDay && revenue.revenueByDay.length > 0 ? (
                    <div className="h-64 flex items-end gap-1">
                        {revenue.revenueByDay.slice(-14).map((day, index) => {
                            const maxRevenue = Math.max(...revenue.revenueByDay.map(d => d.revenue));
                            const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-purple-500 rounded-t"
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                        title={`${day.date}: ${day.revenue} UAH`}
                                    ></div>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        No revenue data available
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
