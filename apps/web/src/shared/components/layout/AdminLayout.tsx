import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/services', label: 'Послуги', icon: '💆' },
    { path: '/admin/masters', label: 'Майстри', icon: '👤' },
    { path: '/admin/bookings', label: 'Бронювання', icon: '📅' },
    { path: '/admin/users', label: 'Користувачі', icon: '👥' },
    { path: '/admin/promo-codes', label: 'Промокоди', icon: '🏷️' },
    { path: '/admin/reviews', label: 'Відгуки', icon: '⭐' },
    { path: '/admin/analytics', label: 'Аналітика', icon: '📈' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-purple-600">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="p-4 border-t">
                    <Link
                        to="/"
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <span className="mr-3">🏠</span>
                        <span>На головну</span>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};
