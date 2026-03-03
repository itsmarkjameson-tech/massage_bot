import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../shared/api/client';
import { GlassCard, GlassCardStatic } from '../../shared/components/ui/GlassCard';
import { SectionHeader, SectionHeaderStatic } from '../../shared/components/ui/SectionHeader';
import { GradientButton } from '../../shared/components/ui/GradientButton';
import { AdminAccessCard } from '../../shared/components/ui/AdminAccessButton';
import type { User, Booking, LoyaltyData } from '../../shared/api/types';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    },
};

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
        console.log('[ProfilePage] Loading data...');
        try {
            setLoading(true);
            setError(null);

            const [profileData, loyaltyData, bookingsData] = await Promise.all([
                api.getProfile(),
                api.getLoyalty(),
                api.getMyBookings(),
            ]);

            console.log('[ProfilePage] Profile loaded:', profileData);
            console.log('[ProfilePage] User role:', profileData.user?.role);

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
            console.error('[ProfilePage] Failed to load profile data:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
            console.log('[ProfilePage] Loading finished');
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
                return 'text-green-400';
            case 'cancelled_by_client':
            case 'cancelled_by_admin':
                return 'text-red-400';
            case 'no_show':
                return 'text-orange-400';
            default:
                return 'text-yellow-400';
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
            <div className="min-h-screen bg-aurora flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card px-8 py-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/80">{t('common.loading')}</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-aurora px-4 py-6">
                <GlassCardStatic variant="elevated" className="p-6 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <GradientButton onClick={loadData}>
                        {t('common.retry')}
                    </GradientButton>
                </GlassCardStatic>
            </div>
        );
    }

    const displayName = user?.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
        : user?.telegramUsername || t('profile.guest');

    return (
        <div className="min-h-screen bg-aurora px-4 py-6 pb-24 animate-fade-in">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-40 left-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 relative z-10"
            >
                <SectionHeaderStatic
                    title={t('profile.title')}
                    size="lg"
                />
            </motion.div>

            {/* Profile Card with Glow Effect */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 mb-8"
            >
                <GlassCard variant="gradient" className="p-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar with Glow */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse-glow" />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-full flex items-center justify-center text-4xl border-2 border-white/20 overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white/90">{displayName}</h2>
                            <p className="text-white/50 text-sm">@{user?.telegramUsername || 'unknown'}</p>
                        </div>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-3 glass-button rounded-xl text-white/70 hover:text-white transition-colors"
                        >
                            ✏️
                        </button>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Profile Info */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3 mb-8 relative z-10"
            >
                <motion.div variants={itemVariants}>
                    <GlassCardStatic variant="elevated" className="p-4 flex justify-between items-center">
                        <span className="text-white/50">{t('profile.phone')}</span>
                        <span className="font-medium text-white/90">{user?.phone || '-'}</span>
                    </GlassCardStatic>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <GlassCardStatic variant="elevated" className="p-4 flex justify-between items-center">
                        <span className="text-white/50">{t('profile.telegram')}</span>
                        <span className="font-medium text-white/90">@{user?.telegramUsername || '-'}</span>
                    </GlassCardStatic>
                </motion.div>
            </motion.div>

            {/* Language Switcher */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 relative z-10"
            >
                <SectionHeaderStatic
                    title={t('profile.language')}
                    size="sm"
                    className="mb-4"
                />
                <GlassCardStatic variant="elevated" className="p-4">
                    <div className="flex gap-2">
                        {[
                            { code: 'uk', label: '🇺🇦 UA' },
                            { code: 'en', label: '🇬🇧 EN' },
                            { code: 'ru', label: '🇷🇺 RU' },
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${i18n.language === lang.code
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-glow'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </GlassCardStatic>
            </motion.div>

            {/* Admin Access Card - Only for admin users */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mb-8 relative z-10"
            >
                <AdminAccessCard />
            </motion.div>

            {/* Loyalty Card */}
            {loyalty && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 relative z-10"
                >
                    <SectionHeaderStatic
                        title={t('profile.loyalty.title')}
                        size="sm"
                        className="mb-4"
                    />
                    <GlassCard variant="gradient" className="p-6">
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-sm text-white/60">{t('profile.loyalty.nextReward')}</span>
                            <span className="font-bold text-2xl gradient-text">{loyalty.currentStamps}/{loyalty.stampsForReward}</span>
                        </div>
                        <div className="flex gap-2 mb-5">
                            {Array.from({ length: loyalty.stampsForReward }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-3 rounded-full border border-white/20 transition-all duration-300 ${i < loyalty.currentStamps
                                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 shadow-glow'
                                        : 'bg-white/5'
                                        }`}
                                />
                            ))}
                        </div>
                        {loyalty.totalRewards > 0 && (
                            <div className="text-sm text-white/60 flex items-center gap-2">
                                <span className="text-xl">🎁</span>
                                {t('profile.loyalty.rewards')}: <span className="text-white font-bold">{loyalty.totalRewards}</span>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            )}

            {/* Visit History */}
            <div className="relative z-10">
                <SectionHeaderStatic
                    title={t('profile.history.title')}
                    size="sm"
                    className="mb-4"
                />
                {bookings.length === 0 ? (
                    <GlassCardStatic variant="elevated" className="p-8 text-center">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="text-white/50">{t('profile.history.noVisits')}</p>
                    </GlassCardStatic>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        {bookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                custom={index}
                                variants={itemVariants}
                            >
                                <GlassCardStatic variant="elevated" className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-semibold text-white/90 mb-1">{getServiceNames(booking)}</h4>
                                            <p className="text-sm text-white/50">
                                                {booking.master?.displayName?.[i18n.language] || booking.master?.displayName?.uk || 'Master'} • {getTotalDuration(booking)} {t('booking.minutes')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-white/50 block">{formatDate(booking.bookingDate)}</span>
                                            <p className={`text-xs font-medium mt-1 ${getStatusColor(booking.status)}`}>
                                                {getStatusText(booking.status)}
                                            </p>
                                        </div>
                                    </div>
                                    {canRebook(booking.status) && (
                                        <button
                                            onClick={() => handleRebook(booking)}
                                            className="text-sm text-violet-400 font-medium hover:text-violet-300 transition-colors flex items-center gap-1"
                                        >
                                            {t('profile.history.rebook')} →
                                        </button>
                                    )}
                                </GlassCardStatic>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm"
                        >
                            <GlassCard variant="gradient" className="p-6">
                                <h3 className="text-xl font-bold mb-6 gradient-text">{t('profile.editProfile')}</h3>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">
                                            {t('profile.firstName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            className="w-full p-3 glass-input text-white/90"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">
                                            {t('profile.lastName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            className="w-full p-3 glass-input text-white/90"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">
                                            {t('profile.phone')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            placeholder="+380XXXXXXXXX"
                                            className="w-full p-3 glass-input text-white/90"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <GradientButton
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        {t('common.cancel')}
                                    </GradientButton>
                                    <GradientButton
                                        className="flex-1"
                                        onClick={handleSaveProfile}
                                        loading={saving}
                                    >
                                        {t('common.save')}
                                    </GradientButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
