import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface Service {
    id: string;
    name: Record<string, string>;
    description?: Record<string, string>;
    imageUrl?: string;
    categoryId?: string;
    category?: { id: string; name: Record<string, string>; isActive: boolean; sortOrder: number };
    isActive: boolean;
    sortOrder: number;
    durations: { id: string; durationMinutes: number; basePrice: number }[];
}

interface Category {
    id: string;
    name: Record<string, string>;
    isActive: boolean;
    sortOrder: number;
    children?: Category[];
    services?: { id: string }[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export const AdminServicesPage: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const fetchServices = async (page = 1) => {
        setLoading(true);
        try {
            const data = await api.get<{ services: Service[]; pagination: Pagination }>(
                `/admin/services?page=${page}&limit=20`
            );
            setServices(data.services);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Failed to fetch services:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await api.get<{ categories: Category[] }>('/admin/services/categories');
            setCategories(data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цю послугу?')) return;
        try {
            await api.delete(`/admin/services/${id}`);
            fetchServices(pagination.page);
        } catch (err) {
            console.error('Failed to delete service:', err);
        }
    };

    const getServiceName = (service: Service) => {
        return service.name.uk || service.name.en || Object.values(service.name)[0] || 'Без назви';
    };

    const getCategoryName = (category: Category) => {
        return category.name.uk || category.name.en || Object.values(category.name)[0] || 'Без назви';
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Послуги</h1>
                    <p className="text-gray-600">Керування послугами салону</p>
                </div>
                <button
                    onClick={() => {
                        setEditingService(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    + Додати послугу
                </button>
            </div>

            {/* Categories Section */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Категорії</h2>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="text-purple-600 hover:text-purple-700"
                    >
                        + Додати категорію
                    </button>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{getCategoryName(category)}</span>
                                    <span className={`px-2 py-1 text-xs rounded ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {category.isActive ? 'Активна' : 'Неактивна'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{category.services?.length || 0} послуг</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Список послуг</h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Назва</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Категорія</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Тривалість</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ціна</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Дії</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {services.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{getServiceName(service)}</div>
                                            {service.description?.uk && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {service.description.uk}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {service.category ? getCategoryName(service.category) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {service.durations.map(d => `${d.durationMinutes}хв`).join(', ')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {service.durations.length > 0
                                                ? `від ${Math.min(...service.durations.map(d => Number(d.basePrice)))} ₴`
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {service.isActive ? 'Активна' : 'Неактивна'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    setEditingService(service);
                                                    setShowModal(true);
                                                }}
                                                className="text-purple-600 hover:text-purple-700 mr-3"
                                            >
                                                Редагувати
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Видалити
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination */}
                <div className="px-4 py-3 border-t flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Показано {services.length} з {pagination.total} послуг
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchServices(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Попередня
                        </button>
                        <button
                            onClick={() => fetchServices(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Наступна
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
