import { useState, useEffect } from 'react';
import { api } from '../../shared/api/client';

interface ScheduleDay {
    date: string;
    isDayOff: boolean;
    startTime: string | null;
    endTime: string | null;
    bookings: {
        id: string;
        startTime: string;
        endTime: string;
        status: string;
        serviceName: string;
        clientName: string;
        clientPhone: string;
        price: number;
    }[];
}

export function MasterSchedulePage() {
    const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [editingSchedule, setEditingSchedule] = useState<{
        date: string;
        startTime: string;
        endTime: string;
        isDayOff: boolean;
    } | null>(null);

    useEffect(() => {
        loadSchedule();
    }, [selectedDate, viewMode]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            const endDate = viewMode === 'week'
                ? new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : undefined;

            const data = await api.get<{ schedule: ScheduleDay[] }>(
                `/master/schedule?startDate=${selectedDate}${endDate ? `&endDate=${endDate}` : ''}`
            );
            setSchedule(data.schedule);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const updateSchedule = async () => {
        if (!editingSchedule) return;

        try {
            await api.put('/master/schedule', {
                workDate: editingSchedule.date,
                startTime: editingSchedule.startTime,
                endTime: editingSchedule.endTime,
                isDayOff: editingSchedule.isDayOff,
            });
            setEditingSchedule(null);
            loadSchedule();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update schedule');
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

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate);
        if (viewMode === 'week') {
            current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
        }
        setSelectedDate(current.toISOString().split('T')[0]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    if (loading && schedule.length === 0) {
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
                <h1 className="text-2xl font-bold text-gray-900">Розклад</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('day')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'day'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        День
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'week'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Тиждень
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-lg font-semibold text-gray-900">
                    {viewMode === 'week' && schedule.length > 0 && (
                        <>{formatDate(schedule[0].date)} - {formatDate(schedule[schedule.length - 1].date)}</>
                    )}
                    {viewMode === 'day' && formatDate(selectedDate)}
                </div>
                <button
                    onClick={() => navigateDate('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Schedule Grid */}
            <div className={`grid gap-4 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                {schedule.map((day) => (
                    <div
                        key={day.date}
                        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${day.date === new Date().toISOString().split('T')[0]
                                ? 'ring-2 ring-purple-500'
                                : ''
                            }`}
                    >
                        {/* Day Header */}
                        <div className={`px-4 py-3 border-b ${day.isDayOff ? 'bg-gray-50' : 'bg-purple-50'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">{formatDate(day.date)}</div>
                                    {day.isDayOff ? (
                                        <span className="text-xs text-gray-500">Вихідний</span>
                                    ) : day.startTime ? (
                                        <span className="text-xs text-gray-500">{day.startTime} - {day.endTime}</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Не встановлено</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setEditingSchedule({
                                        date: day.date,
                                        startTime: day.startTime || '09:00',
                                        endTime: day.endTime || '18:00',
                                        isDayOff: day.isDayOff,
                                    })}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Bookings */}
                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                            {day.bookings.length === 0 ? (
                                <div className="text-center text-gray-400 py-4 text-sm">
                                    Немає записів
                                </div>
                            ) : (
                                day.bookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="p-3 bg-gray-50 rounded-lg space-y-1"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900 text-sm">
                                                {booking.startTime} - {booking.endTime}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">{booking.serviceName}</div>
                                        <div className="text-sm text-gray-500">{booking.clientName}</div>
                                        <div className="text-sm text-gray-500">{booking.clientPhone}</div>
                                        <div className="text-sm font-medium text-purple-600">{booking.price} ₴</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingSchedule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Редагувати розклад
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {formatDate(editingSchedule.date)}
                        </p>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={editingSchedule.isDayOff}
                                    onChange={(e) => setEditingSchedule({
                                        ...editingSchedule,
                                        isDayOff: e.target.checked,
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-700">Вихідний день</span>
                            </label>

                            {!editingSchedule.isDayOff && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Початок роботи
                                        </label>
                                        <input
                                            type="time"
                                            value={editingSchedule.startTime}
                                            onChange={(e) => setEditingSchedule({
                                                ...editingSchedule,
                                                startTime: e.target.value,
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Кінець роботи
                                        </label>
                                        <input
                                            type="time"
                                            value={editingSchedule.endTime}
                                            onChange={(e) => setEditingSchedule({
                                                ...editingSchedule,
                                                endTime: e.target.value,
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingSchedule(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={updateSchedule}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Зберегти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
