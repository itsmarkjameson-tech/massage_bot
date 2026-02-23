import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../shared/api/client';
import { useTranslatedContent } from '../../shared/hooks/useTranslatedContent';

// Types
interface Service {
    id: string;
    name: Record<string, string>;
    imageUrl: string | null;
    durations: Array<{
        id: string;
        durationMinutes: number;
        price: number;
    }>;
}

interface Master {
    id: string;
    displayName: Record<string, string>;
    photoUrl: string | null;
}

interface WaitlistEntry {
    id: string;
    serviceId: string;
    masterId: string | null;
    preferredDate: string;
    preferredStart: string | null;
    preferredEnd: string | null;
    status: 'active' | 'notified' | 'booked' | 'expired';
    createdAt: string;
    service: {
        id: string;
        name: Record<string, string>;
        imageUrl: string | null;
    };
    master: {
        id: string;
        displayName: Record<string, string>;
        photoUrl: string | null;
    } | null;
}

interface ServicesResponse {
    services: Service[];
}

interface MastersResponse {
    masters: Master[];
}

interface WaitlistResponse {
    entries: WaitlistEntry[];
}

interface AddWaitlistResponse {
    waitlistEntry: WaitlistEntry;
}

// Animation variants
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export function WaitlistPage() {
    const { t } = useTranslation();
    const { t: tContent } = useTranslatedContent();

    // Data states
    const [services, setServices] = useState<Service[]>([]);
    const [masters, setMasters] = useState<Master[]>([]);
    const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedMaster, setSelectedMaster] = useState<string>('');
    const [preferredDate, setPreferredDate] = useState<string>('');
    const [preferredStart, setPreferredStart] = useState<string>('');
    const [preferredEnd, setPreferredEnd] = useState<string>('');

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [servicesData, mastersData, waitlistData] = await Promise.all([
                    api.get<ServicesResponse>('/services'),
                    api.get<MastersResponse>('/masters'),
                    api.get<WaitlistResponse>('/waitlist'),
                ]);

                setServices(servicesData.services || []);
                setMasters(mastersData.masters || []);
                setWaitlistEntries(waitlistData.entries || []);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [t]);

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post<AddWaitlistResponse>('/waitlist', {
                serviceId: selectedService,
                masterId: selectedMaster || undefined,
                preferredDate,
                preferredStart: preferredStart || undefined,
                preferredEnd: preferredEnd || undefined,
            });

            setWaitlistEntries([response.waitlistEntry, ...waitlistEntries]);
            setSuccess(t('waitlist.added'));
            setShowForm(false);
            resetForm();
        } catch (err: any) {
            setError(err?.message || t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!confirm(t('waitlist.confirmDelete'))) return;

        try {
            await api.delete(`/waitlist/${id}`);
            setWaitlistEntries(waitlistEntries.filter((e) => e.id !== id));
            setSuccess(t('waitlist.removed'));
        } catch (err: any) {
            setError(err?.message || t('common.error'));
        }
    };

    // Reset form
    const resetForm = () => {
        setSelectedService('');
        setSelectedMaster('');
        setPreferredDate('');
        setPreferredStart('');
        setPreferredEnd('');
    };

    // Get status badge
    const getStatusBadge = (status: WaitlistEntry['status']) => {
        const styles = {
            active: 'bg-blue-100 text-blue-700',
            notified: 'bg-green-100 text-green-700',
            booked: 'bg-purple-100 text-purple-700',
            expired: 'bg-gray-100 text-gray-700',
        };

        const labels = {
            active: t('waitlist.status.active'),
            notified: t('waitlist.status.notified'),
            booked: t('waitlist.status.booked'),
            expired: t('waitlist.status.expired'),
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pb-20"
        >
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white p-6 rounded-b-3xl">
                <h1 className="text-2xl font-bold mb-2">{t('waitlist.title')}</h1>
                <p className="opacity-90 text-sm">{t('waitlist.subtitle')}</p>
            </div>

            {/* Add Button */}
            <div className="px-4 py-4">
                <motion.button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full py-3 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-semibold shadow-lg"
                    whileTap={{ scale: 0.97 }}
                >
                    {showForm ? t('common.cancel') : t('waitlist.add')}
                </motion.button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4"
                    >
                        <form onSubmit={handleSubmit} className="bg-[var(--color-secondary-bg)] rounded-2xl p-4 space-y-4">
                            {/* Service Select */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('waitlist.service')} *
                                </label>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    required
                                    className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl min-h-[44px]"
                                >
                                    <option value="">{t('waitlist.selectService')}</option>
                                    {services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {tContent(service.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Master Select (Optional) */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('waitlist.master')} ({t('common.optional')})
                                </label>
                                <select
                                    value={selectedMaster}
                                    onChange={(e) => setSelectedMaster(e.target.value)}
                                    className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl min-h-[44px]"
                                >
                                    <option value="">{t('waitlist.anyMaster')}</option>
                                    {masters.map((master) => (
                                        <option key={master.id} value={master.id}>
                                            {tContent(master.displayName)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preferred Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('waitlist.preferredDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={preferredDate}
                                    onChange={(e) => setPreferredDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl"
                                />
                            </div>

                            {/* Preferred Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('waitlist.preferredStart')}
                                    </label>
                                    <input
                                        type="time"
                                        value={preferredStart}
                                        onChange={(e) => setPreferredStart(e.target.value)}
                                        className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('waitlist.preferredEnd')}
                                    </label>
                                    <input
                                        type="time"
                                        value={preferredEnd}
                                        onChange={(e) => setPreferredEnd(e.target.value)}
                                        className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-semibold shadow-lg disabled:opacity-50"
                                whileTap={{ scale: 0.97 }}
                            >
                                {submitting ? t('common.loading') : t('waitlist.submit')}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error/Success Messages */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm"
                >
                    {error}
                </motion.div>
            )}

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm"
                >
                    {success}
                </motion.div>
            )}

            {/* Waitlist Entries */}
            <div className="px-4">
                <h2 className="text-lg font-bold mb-3">{t('waitlist.myEntries')}</h2>

                {waitlistEntries.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-hint)]">
                        <div className="text-4xl mb-2">📋</div>
                        <p>{t('waitlist.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {waitlistEntries.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, x: -100 }}
                                    className={`bg-[var(--color-secondary-bg)] rounded-2xl p-4 ${entry.status === 'notified' ? 'ring-2 ring-green-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-xl flex items-center justify-center text-xl overflow-hidden">
                                                {entry.service.imageUrl ? (
                                                    <img
                                                        src={entry.service.imageUrl}
                                                        alt={tContent(entry.service.name)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    '💆'
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">
                                                    {tContent(entry.service.name)}
                                                </h3>
                                                {entry.master && (
                                                    <p className="text-sm text-[var(--color-hint)]">
                                                        👤 {tContent(entry.master.displayName)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(entry.status)}
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-[var(--color-hint)]">
                                        <div>
                                            <span>📅 {formatDate(entry.preferredDate)}</span>
                                            {entry.preferredStart && (
                                                <span className="ml-2">
                                                    ⏰ {entry.preferredStart}
                                                    {entry.preferredEnd && ` - ${entry.preferredEnd}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {entry.status === 'notified' && (
                                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                            <motion.button
                                                onClick={() => {
                                                    // Navigate to booking with pre-filled data
                                                    window.location.href = `/booking?service=${entry.serviceId}&master=${entry.masterId || ''}`;
                                                }}
                                                className="w-full py-2 bg-green-500 text-white rounded-xl font-semibold text-sm"
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {t('waitlist.bookNow')}
                                            </motion.button>
                                        </div>
                                    )}

                                    {entry.status === 'active' && (
                                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="w-full py-2 text-red-500 text-sm font-medium"
                                            >
                                                {t('waitlist.remove')}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
