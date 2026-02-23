import { useState, useEffect } from 'react';
import { api } from '../../shared/api/client';

interface Booking {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    totalPrice: number;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    notes?: string;
}

export function MasterBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        loadBookings();
    }, [filter]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            let scheduleData;
            switch (filter) {
                case 'today':
                    scheduleData = await api.get<{ schedule: { bookings: Booking[] }[] }>(
                        `/master/schedule?startDate=${today}&endDate=${today}`
                    );
                    break;
                case 'upcoming':
                    scheduleData = await api.get<{ schedule: { bookings: Booking[] }[] }>(
                        `/master/schedule?startDate=${today}`
                    );
                    break;
                case 'completed':
                    scheduleData = await api.get<{ schedule: { bookings: Booking[] }[] }>(
                        `/master/schedule?startDate=2020-01-01&endDate=${today}`
                    );
                    break;
                default:
                    scheduleData = await api.get<{ schedule: { bookings: Booking[] }[] }>(
                        `/master/schedule?startDate=2020-01-01`
                    );
            }

            // Flatten all bookings from schedule
            const allBookings = scheduleData.schedule.flatMap(day => day.bookings);

            // For completed filter, we need to filter by status
            const filtered = filter === 'completed'
                ? allBookings.filter(b => b.status === 'completed' || b.status === 'no_show')
                : allBookings;

            setBookings(filtered);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId: string, status: 'completed' | 'no_show') => {
        try {
            await api.patch(`/master/bookings/${bookingId}/status`, {
                status,
                notes: statusNote,
            });
            setSelectedBooking(null);
            setStatusNote('');
            loadBookings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update booking');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending_confirmation':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'no_show':
                return 'bg-red-100 text-red-800';
            case 'cancelled_by_client':
            case 'cancelled_by_admin':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'Підтверджено';
            case 'pending_confirmation':
                return 'Очікує';
            case 'in_progress':
                return 'В процесі';
            case 'completed':
                return 'Завершено';
            case 'no_show':
                return 'Не з\'явився';
            case 'cancelled_by_client':
                return 'Скасовано клієнтом';
            case 'cancelled_by_admin':
                return 'Скасовано адміном';
            default:
                return status;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Записи</h1>
                <div className="text-sm text-gray-500">
                    {bookings.length} записів
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Всі
                </button>
                <button
                    onClick={() => setFilter('today')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'today'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Сьогодні
                </button>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'upcoming'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Майбутні
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'completed'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Завершені
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Bookings List */}
            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Немає записів</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {formatDate(booking.bookingDate)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {booking.startTime} - {booking.endTime}
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm text-gray-600">{booking.serviceName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">{booking.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">{booking.clientPhone}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                <div className="text-lg font-bold text-purple-600">
                                    {booking.totalPrice} ₴
                                </div>
                                {booking.status !== 'completed' && booking.status !== 'no_show' && (
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Дії
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Дії з записом
                        </h2>

                        <div className="space-y-3 mb-4">
                            <div className="text-sm text-gray-500">
                                {formatDate(selectedBooking.bookingDate)} • {selectedBooking.startTime} - {selectedBooking.endTime}
                            </div>
                            <div className="font-medium text-gray-900">
                                {selectedBooking.serviceName}
                            </div>
                            <div className="text-gray-600">
                                Клієнт: {selectedBooking.clientName}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Примітка (необов'язково)
                            </label>
                            <textarea
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder="Додати примітку..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Завершити
                            </button>
                            <button
                                onClick={() => updateBookingStatus(selectedBooking.id, 'no_show')}
                                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Клієнт не з'явився
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedBooking(null);
                                setStatusNote('');
                            }}
                            className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
