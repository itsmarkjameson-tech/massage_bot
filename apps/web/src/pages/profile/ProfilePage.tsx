import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api/client';
import type { User, Booking, LoyaltyData } from '../../shared/api/types';

export function ProfilePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
    const [saving, setSaving] = useState(false);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
        // Save to backend
        if (user) {
            api.updateProfile({ language: lang }).catch(console.error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [profileData, loyaltyData, bookingsData] = await Promise.all([
                api.getProfile(),
                api.getLoyalty(),
                api.getMyBookings(),
            ]);

            setUser(profileData.user);
            setLoyalty(loyaltyData);
            setBookings(bookingsData.bookings);

            // Initialize edit form
            setEditForm({
                firstName: profileData.user.firstName || '',
                lastName: profileData.user.lastName || '',
                phone: profileData.user.phone || '',
            });
        } catch (err) {
            console.error('Failed to load profile data:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const updated = await api.updateProfile(editForm);
            setUser(updated.user);
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleRebook = (booking: Booking) => {
        // Store rebook data in sessionStorage for BookingPage to use
        const rebookData = {
            masterId: booking.masterId,
            serviceDurations: booking.items.map(item => ({
                serviceId: item.serviceId,
                durationId: item.durationId,
            })),
        };
        sessionStorage.setItem('rebookData', JSON.stringify(rebookData));
        navigate('/booking');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-500';
            case 'cancelled_by_client':
            case 'cancelled_by_admin':
                return 'text-red-500';
            case 'no_show':
                return 'text-orange-500';
            default:
                return 'text-yellow-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return t('profile.history.status.completed');
            case 'cancelled_by_client':
                return t('profile.history.status.cancelled');
            case 'cancelled_by_admin':
                return t('profile.history.status.cancelledByAdmin');
            case 'no_show':
                return t('profile.history.status.noShow');
            case 'pending_confirmation':
                return t('profile.history.status.pending');
            case 'confirmed':
                return t('profile.history.status.confirmed');
            case 'in_progress':
                return t('profile.history.status.inProgress');
            default:
                return status;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getServiceNames = (booking: Booking) => {
        return booking.items.map(item => item.service.name[i18n.language] || item.service.name.uk || Object.values(item.service.name)[0]).join(', ');
    };

    const getTotalDuration = (booking: Booking) => {
        return booking.items.reduce((sum, item) => sum + item.duration.durationMinutes, 0);
    };

    const canRebook = (status: string) => {
        return ['completed', 'cancelled_by_client', 'cancelled_by_admin', 'no_show'].includes(status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-[var(--color-hint)]">{t('common.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-6 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    const displayName = user?.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
        : user?.telegramUsername || t('profile.guest');

    return (
        <div className="px-4 py-6 animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>

            {/* Avatar & Name */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center text-4xl">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        '👤'
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{displayName}</h2>
                    <p className="text-[var(--color-hint)]">@{user?.telegramUsername || 'unknown'}</p>
                </div>
                <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-[var(--color-link)]"
                >
                    ✏️
                </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-[var(--color-secondary-bg)] rounded-2xl">
                    <span className="text-[var(--color-hint)]">{t('profile.phone')}</span>
                    <span className="font-medium">{user?.phone || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--color-secondary-bg)] rounded-2xl">
                    <span className="text-[var(--color-hint)]">{t('profile.telegram')}</span>
                    <span className="font-medium">@{user?.telegramUsername || '-'}</span>
                </div>
            </div>

            {/* Language Switcher */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{t('profile.language')}</h3>
                <div className="flex gap-2">
                    {[
                        { code: 'uk', label: '🇺🇦 UA' },
                        { code: 'en', label: '🇬🇧 EN' },
                        { code: 'ru', label: '🇷🇺 RU' },
                    ].map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${i18n.language === lang.code
                                    ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                                    : 'bg-[var(--color-secondary-bg)] text-[var(--color-text)]'
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loyalty Card */}
            {loyalty && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3">{t('profile.loyalty.title')}</h3>
                    <div className="p-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl text-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm opacity-80">{t('profile.loyalty.nextReward')}</span>
                            <span className="font-bold">{loyalty.currentStamps}/{loyalty.stampsForReward}</span>
                        </div>
                        <div className="flex gap-2 mb-4">
                            {Array.from({ length: loyalty.stampsForReward }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-6 h-6 rounded-full border-2 border-white/50 ${i < loyalty.currentStamps ? 'bg-white' : 'bg-transparent'
                                        }`}
                                />
                            ))}
                        </div>
                        {loyalty.totalRewards > 0 && (
                            <div className="text-sm opacity-80">
                                {t('profile.loyalty.rewards')}: {loyalty.totalRewards}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Visit History */}
            <div>
                <h3 className="text-lg font-semibold mb-3">{t('profile.history.title')}</h3>
                {bookings.length === 0 ? (
                    <p className="text-[var(--color-hint)] text-center py-4">{t('profile.history.noVisits')}</p>
                ) : (
                    <div className="space-y-3">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-[var(--color-secondary-bg)] rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">{getServiceNames(booking)}</h4>
                                        <p className="text-sm text-[var(--color-hint)]">
                                            {booking.master?.displayName?.[i18n.language] || booking.master?.displayName?.uk || 'Master'} • {getTotalDuration(booking)} {t('booking.minutes')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-[var(--color-hint)]">{formatDate(booking.bookingDate)}</span>
                                        <p className={`text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {getStatusText(booking.status)}
                                        </p>
                                    </div>
                                </div>
                                {canRebook(booking.status) && (
                                    <button
                                        onClick={() => handleRebook(booking)}
                                        className="text-sm text-[var(--color-link)] font-medium"
                                    >
                                        {t('profile.history.rebook')} →
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-bg)] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">{t('profile.editProfile')}</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm text-[var(--color-hint)] mb-1">
                                    {t('profile.firstName')}
                                </label>
                                <input
                                    type="text"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                    className="w-full p-3 bg-[var(--color-secondary-bg)] rounded-xl text-[var(--color-text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-hint)] mb-1">
                                    {t('profile.lastName')}
                                </label>
                                <input
                                    type="text"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                    className="w-full p-3 bg-[var(--color-secondary-bg)] rounded-xl text-[var(--color-text)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-hint)] mb-1">
                                    {t('profile.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+380XXXXXXXXX"
                                    className="w-full p-3 bg-[var(--color-secondary-bg)] rounded-xl text-[var(--color-text)]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 bg-[var(--color-secondary-bg)] rounded-xl font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex-1 py-3 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-medium disabled:opacity-50"
                            >
                                {saving ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
