import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { HomePage } from '../pages/home/HomePage';
import { BookingPage } from '../pages/booking/BookingPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { WaitlistPage } from '../pages/waitlist/WaitlistPage';
import { MasterDashboardPage } from '../pages/master/MasterDashboardPage';
import { MasterSchedulePage } from '../pages/master/MasterSchedulePage';
import { MasterBookingsPage } from '../pages/master/MasterBookingsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminServicesPage } from '../pages/admin/AdminServicesPage';
import { AdminMastersPage } from '../pages/admin/AdminMastersPage';
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminPromoCodesPage } from '../pages/admin/AdminPromoCodesPage';
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';

const router = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            { path: '/', element: <HomePage /> },
            { path: '/booking', element: <BookingPage /> },
            { path: '/profile', element: <ProfilePage /> },
            { path: '/waitlist', element: <WaitlistPage /> },
            // Master routes
            { path: '/master', element: <MasterDashboardPage /> },
            { path: '/master/schedule', element: <MasterSchedulePage /> },
            { path: '/master/bookings', element: <MasterBookingsPage /> },
        ],
    },
    // Admin routes
    { path: '/admin', element: <AdminDashboardPage /> },
    { path: '/admin/services', element: <AdminServicesPage /> },
    { path: '/admin/masters', element: <AdminMastersPage /> },
    { path: '/admin/bookings', element: <AdminBookingsPage /> },
    { path: '/admin/users', element: <AdminUsersPage /> },
    { path: '/admin/promo-codes', element: <AdminPromoCodesPage /> },
    { path: '/admin/reviews', element: <AdminReviewsPage /> },
    { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
