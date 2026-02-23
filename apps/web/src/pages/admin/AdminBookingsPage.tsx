import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface Booking {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    totalPrice: number;
    user: {
        id: string;
        telegramUsername?: string;
        firstName?: string;
        lastName?: string;
    };
    master?: {
        id: string;
        displayName: Record<string, string>;
    };
    items: {
        service: { name: Record<string, string> };
        duration: { durationMinutes: number };
    }[];
}

const statusColors: Record<string, string> = {
    pending_confirmation: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled_by_client: 'bg-red-100 text-red-700',
    cancelled_by_admin: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
    pending_confirmation: 'Очікує підтвердження',
    confirmed: 'Підтверджено',
    in_progress: 'В процесі',
    completed: 'Завершено',
    cancelled_by_client: 'Скасовано клієнтом',
    cancelled_by_admin: 'Скасовано адміном',
    no_show: 'No show',
};

export const AdminBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const fetchBookings = async (pageNum = 1, status = '') => {
        setLoading(true);
        try {
            const query = `/admin/bookings?page=${pageNum}&limit=20${status ? `&status=${status}` : ''}`;
            const data = await api.get<{ bookings: Booking[]; pagination: { total: number; totalPages: number } }>(query);
            setBookings(data.bookings);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(1, statusFilter);
    }, [statusFilter]);

    const handleStatusChange = async (bookingId: string, status: string) => {
        try {
            await api.patch(`/admin/bookings/${bookingId}/status`, { status });
            fetchBookings(page, statusFilter);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const getServiceName = (item: Booking['items'][0]) => {
        return item.service.name.uk || item.service.name.en || Object.values(item.service.name)[0] || 'Послуга';
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Бронювання</h1>
                <p className="text-gray-600">Керування бронюваннями салону</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">Всі статуси</option>
                        <option value="pending_confirmation">Очікує підтвердження</option>
                        <option value="confirmed">Підтверджено</option>
                        <option value="in_progress">В процесі</option>
                        <option value="completed">Завершено</option>
                        <option value="cancelled_by_client">Скасовано клієнтом</option>
                        <option value="cancelled_by_admin">Скасовано адміном</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Дата</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Клієнт</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Послуги</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Майстер</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Сума</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Дії</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">
                                                {new Date(booking.bookingDate).toLocaleDateString('uk-UA')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {booking.startTime} - {booking.endTime}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">
                                                {booking.user.firstName || booking.user.telegramUsername || 'Невідомо'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">
                                                {booking.items.map(item => getServiceName(item)).join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {booking.master
                                                ? booking.master.displayName.uk || booking.master.displayName.en
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {Number(booking.totalPrice)} ₴
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={booking.status}
                                                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                className={`text-xs px-2 py-1 rounded ${statusColors[booking.status] || 'bg-gray-100'}`}
                                            >
                                                {Object.entries(statusLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-purple-600 hover:text-purple-700 text-sm">
                                                Деталі
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
