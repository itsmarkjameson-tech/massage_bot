import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface Master {
    id: string;
    displayName: Record<string, string>;
    bio?: Record<string, string>;
    photoUrl?: string;
    specialization?: string;
    isActive: boolean;
    sortOrder: number;
    rating: number;
    reviewCount: number;
    user: {
        id: string;
        telegramId: number;
        telegramUsername?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    };
}

export const AdminMastersPage: React.FC = () => {
    const [masters, setMasters] = useState<Master[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchMasters = async (pageNum = 1) => {
        setLoading(true);
        try {
            const data = await api.get<{ masters: Master[]; pagination: { total: number; totalPages: number } }>(
                `/admin/masters?page=${pageNum}&limit=20`
            );
            setMasters(data.masters);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasters();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цього майстра?')) return;
        try {
            await api.delete(`/admin/masters/${id}`);
            fetchMasters(page);
        } catch (err) {
            console.error('Failed to delete master:', err);
        }
    };

    const getMasterName = (master: Master) => {
        return master.displayName.uk || master.displayName.en || Object.values(master.displayName)[0] || 'Без назви';
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Майстри</h1>
                    <p className="text-gray-600">Керування майстрами салону</p>
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    + Додати майстра
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {masters.map((master) => (
                            <div key={master.id} className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center">
                                        {master.photoUrl ? (
                                            <img
                                                src={master.photoUrl}
                                                alt={getMasterName(master)}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                                                <span className="text-2xl">👤</span>
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <h3 className="font-semibold text-gray-900">{getMasterName(master)}</h3>
                                            {master.specialization && (
                                                <p className="text-sm text-gray-500">{master.specialization}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${master.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {master.isActive ? 'Активний' : 'Неактивний'}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-yellow-500">⭐</span>
                                        <span className="ml-1 text-sm font-medium">{master.rating.toFixed(1)}</span>
                                        <span className="ml-1 text-sm text-gray-500">({master.reviewCount})</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-purple-600 hover:text-purple-700 text-sm">
                                            Редагувати
                                        </button>
                                        <button
                                            onClick={() => handleDelete(master.id)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Видалити
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
