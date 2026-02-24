import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { LoadingSpinner } from '../shared/components/ui/LoadingSpinner';

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('../pages/home/HomePage').then(m => ({ default: m.HomePage })));
const BookingPage = lazy(() => import('../pages/booking/BookingPage').then(m => ({ default: m.BookingPage })));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const WaitlistPage = lazy(() => import('../pages/waitlist/WaitlistPage').then(m => ({ default: m.WaitlistPage })));

// Master pages
const MasterDashboardPage = lazy(() => import('../pages/master/MasterDashboardPage').then(m => ({ default: m.MasterDashboardPage })));
const MasterSchedulePage = lazy(() => import('../pages/master/MasterSchedulePage').then(m => ({ default: m.MasterSchedulePage })));
const MasterBookingsPage = lazy(() => import('../pages/master/MasterBookingsPage').then(m => ({ default: m.MasterBookingsPage })));

// Admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminServicesPage = lazy(() => import('../pages/admin/AdminServicesPage').then(m => ({ default: m.AdminServicesPage })));
const AdminMastersPage = lazy(() => import('../pages/admin/AdminMastersPage').then(m => ({ default: m.AdminMastersPage })));
const AdminBookingsPage = lazy(() => import('../pages/admin/AdminBookingsPage').then(m => ({ default: m.AdminBookingsPage })));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminPromoCodesPage = lazy(() => import('../pages/admin/AdminPromoCodesPage').then(m => ({ default: m.AdminPromoCodesPage })));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })));

// Loading fallback component
function PageLoader() {
    return <LoadingSpinner fullScreen />;
}

const router = createBrowserRouter([
    {
        element: (
            <Suspense fallback={<PageLoader />}>
                <AppLayout />
            </Suspense>
        ),
        children: [
            {
                path: '/',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <HomePage />
                    </Suspense>
                )
            },
            {
                path: '/booking',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <BookingPage />
                    </Suspense>
                )
            },
            {
                path: '/profile',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <ProfilePage />
                    </Suspense>
                )
            },
            {
                path: '/waitlist',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <WaitlistPage />
                    </Suspense>
                )
            },
            // Master routes
            {
                path: '/master',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <MasterDashboardPage />
                    </Suspense>
                )
            },
            {
                path: '/master/schedule',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <MasterSchedulePage />
                    </Suspense>
                )
            },
            {
                path: '/master/bookings',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <MasterBookingsPage />
                    </Suspense>
                )
            },
        ],
    },
    // Admin routes (lazy loaded)
    {
        path: '/admin',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminDashboardPage />
            </Suspense>
        )
    },
    {
        path: '/admin/services',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminServicesPage />
            </Suspense>
        )
    },
    {
        path: '/admin/masters',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminMastersPage />
            </Suspense>
        )
    },
    {
        path: '/admin/bookings',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminBookingsPage />
            </Suspense>
        )
    },
    {
        path: '/admin/users',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminUsersPage />
            </Suspense>
        )
    },
    {
        path: '/admin/promo-codes',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminPromoCodesPage />
            </Suspense>
        )
    },
    {
        path: '/admin/reviews',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminReviewsPage />
            </Suspense>
        )
    },
    {
        path: '/admin/analytics',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AdminAnalyticsPage />
            </Suspense>
        )
    },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
