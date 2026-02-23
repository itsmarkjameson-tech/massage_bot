import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface User {
    id: string;
    telegramId: number;
    telegramUsername?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
    language: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        bookings: number;
        reviews: number;
    };
}

const roleLabels: Record<string, string> = {
    client: 'Клієнт',
    master: 'Майстер',
    admin: 'Адмін',
    owner: 'Власник',
};

export const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchUsers = async (pageNum = 1, searchQuery = '', role = '') => {
        setLoading(true);
        try {
            let query = `/admin/users?page=${pageNum}&limit=20`;
            if (searchQuery) query += `&search=${searchQuery}`;
            if (role) query += `&role=${role}`;
            const data = await api.get<{ users: User[]; pagination: { total: number; totalPages: number } }>(query);
            setUsers(data.users);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1, search, roleFilter);
    }, []);

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role });
            fetchUsers(page, search, roleFilter);
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Користувачі</h1>
                <p className="text-gray-600">Керування користувачами системи</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Пошук..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1, search, roleFilter)}
                        className="px-4 py-2 border rounded-lg flex-1"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            fetchUsers(1, search, e.target.value);
                        }}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">Всі ролі</option>
                        <option value="client">Клієнт</option>
                        <option value="master">Майстер</option>
                        <option value="admin">Адмін</option>
                        <option value="owner">Власник</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Telegram ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ім'я</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Телефон</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Роль</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Бронювань</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Дії</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {user.telegramUsername ? `@${user.telegramUsername}` : user.telegramId}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {user.firstName} {user.lastName || ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="text-sm border rounded px-2 py-1"
                                            >
                                                {Object.entries(roleLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {user._count.bookings}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.isActive ? 'Активний' : 'Заблокований'}
                                            </span>
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
