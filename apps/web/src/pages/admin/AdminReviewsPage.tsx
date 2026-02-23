import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { api } from '../../shared/api/client';

interface Review {
    id: string;
    rating: number;
    comment?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    user: {
        id: string;
        telegramUsername?: string;
        firstName?: string;
    };
    master: {
        id: string;
        displayName: Record<string, string>;
    };
}

export const AdminReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchReviews = async (status = '') => {
        setLoading(true);
        try {
            const query = status ? `/admin/reviews?status=${status}` : '/admin/reviews';
            const data = await api.get<{ reviews: Review[] }>(query);
            setReviews(data.reviews);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(statusFilter);
    }, [statusFilter]);

    const handleStatusChange = async (reviewId: string, status: string) => {
        try {
            await api.patch(`/admin/reviews/${reviewId}/status`, { status });
            fetchReviews(statusFilter);
        } catch (err) {
            console.error('Failed to update review status:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/admin/reviews/${id}`);
            fetchReviews(statusFilter);
        } catch (err) {
            console.error('Failed to delete review:', err);
        }
    };

    const getMasterName = (master: Review['master']) => {
        return master.displayName.uk || master.displayName.en || Object.values(master.displayName)[0] || 'Master';
    };

    const renderStars = (rating: number) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                <p className="text-gray-600">Manage client reviews</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">
                                                {review.user.firstName || review.user.telegramUsername || 'Anonymous'}
                                            </span>
                                            <span className="text-yellow-500">{renderStars(review.rating)}</span>
                                            <span className={`px-2 py-1 text-xs rounded ${review.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {review.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Master: {getMasterName(review.master)}</p>
                                        {review.comment && (
                                            <p className="mt-2 text-gray-700">{review.comment}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(review.createdAt).toLocaleDateString('uk-UA')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {review.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(review.id, 'approved')}
                                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(review.id, 'rejected')}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Delete
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
