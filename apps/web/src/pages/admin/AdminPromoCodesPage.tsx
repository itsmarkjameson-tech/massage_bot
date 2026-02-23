import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface PromoCode {
    id: string;
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    currentUses: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    _count: { bookings: number };
}

export const AdminPromoCodesPage: React.FC = () => {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchPromoCodes = async () => {
        setLoading(true);
        try {
            const data = await api.get<{ promoCodes: PromoCode[] }>('/admin/promo-codes');
            setPromoCodes(data.promoCodes);
        } catch (err) {
            console.error('Failed to fetch promo codes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            await api.delete(`/admin/promo-codes/${id}`);
            fetchPromoCodes();
        } catch (err) {
            console.error('Failed to delete promo code:', err);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('uk-UA');
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
                    <p className="text-gray-600">Manage promo codes and discounts</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    + Add Promo Code
                </button>
            </div>

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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Discount</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min Order</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Uses</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Valid Until</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {promoCodes.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-medium text-purple-600">{promo.code}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {promo.discountType === 'percent'
                                                ? `${promo.discountValue}%`
                                                : `${promo.discountValue} UAH`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {promo.minOrderAmount ? `${promo.minOrderAmount} UAH` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {promo.currentUses} {promo.maxUses ? `/ ${promo.maxUses}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {formatDate(promo.validUntil)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {promo.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Delete
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
