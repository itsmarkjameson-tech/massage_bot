import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../shared/api/client';
import { GlassCard, GlassCardStatic } from '../../shared/components/ui/GlassCard';
import { GradientButton } from '../../shared/components/ui/GradientButton';
import type { Service, Master, ServiceDuration, MasterService } from '../../shared/api/types';

// Types for booking wizard
interface SelectedService {
    service: Service;
    duration: ServiceDuration;
}

type WizardStep = 'service' | 'master' | 'datetime' | 'confirm';

// Animation variants
const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
    },
    exit: { opacity: 0, x: -30 }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    }),
};

export function BookingPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const lang = i18n.language || 'uk';

    // Wizard state
    const [step, setStep] = useState<WizardStep>('service');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [services, setServices] = useState<Service[]>([]);
    const [availableMasters, setAvailableMasters] = useState<Master[]>([]);
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Booking data
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoError, setPromoError] = useState<string | null>(null);

    // Success state
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [createdBooking, setCreatedBooking] = useState<any>(null);
    const [rebookData, setRebookData] = useState<{ masterId: string; serviceDurations: Array<{ serviceId: string; durationId: string }> } | null>(null);

    // Computed values
    const totalDuration = useMemo(() =>
        selectedServices.reduce((sum, s) => sum + s.duration.durationMinutes, 0),
        [selectedServices]
    );

    const totalPrice = useMemo(() => {
        return selectedServices.reduce((sum, s) => {
            const basePrice = s.duration.basePrice;
            const masterService = selectedMaster?.masterServices?.find(
                (ms: MasterService) => ms.serviceId === s.service.id
            );
            const modifier = masterService?.priceModifier || 0;
            return sum + basePrice + modifier;
        }, 0);
    }, [selectedServices, selectedMaster]);

    const finalPrice = totalPrice - promoDiscount;

    // Process rebook data from previous booking
    const processRebookData = async (data: { masterId: string; serviceDurations: Array<{ serviceId: string; durationId: string }> }) => {
        try {
            // Find services and durations that match
            const selected: SelectedService[] = [];

            for (const sd of data.serviceDurations) {
                const service = services.find(s => s.id === sd.serviceId);
                if (service) {
                    const duration = service.durations.find(d => d.id === sd.durationId);
                    if (duration) {
                        selected.push({ service, duration });
                    }
                }
            }

            if (selected.length > 0) {
                setSelectedServices(selected);

                // Load master and set
                const master = await api.getMaster(data.masterId);
                setSelectedMaster(master.master);

                // Skip to datetime step
                setStep('datetime');
            }
        } catch (err) {
            console.error('Failed to process rebook data:', err);
        }
    };

    // Load services on mount
    useEffect(() => {
        loadServices();

        // Check for rebook data
        const storedRebookData = sessionStorage.getItem('rebookData');
        if (storedRebookData) {
            try {
                const parsed = JSON.parse(storedRebookData);
                sessionStorage.removeItem('rebookData');
                setRebookData(parsed);
            } catch (e) {
                console.error('Failed to parse rebook data:', e);
            }
        }
    }, []);

    // Process rebook data after services are loaded
    useEffect(() => {
        if (rebookData && services.length > 0) {
            processRebookData(rebookData);
        }
    }, [rebookData, services]);

    // Load available masters when services change
    useEffect(() => {
        if (selectedServices.length > 0) {
            loadAvailableMasters();
        }
    }, [selectedServices, selectedDate]);

    // Load time slots when master/date/duration changes
    useEffect(() => {
        if (selectedMaster && selectedDate && totalDuration > 0) {
            loadTimeSlots();
        }
    }, [selectedMaster, selectedDate, totalDuration]);

    const loadServices = async () => {
        try {
            setLoading(true);
            const data = await api.getServices();
            setServices(data.services || []);
        } catch (err) {
            console.error('Failed to load services:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableMasters = async () => {
        try {
            const serviceIds = selectedServices.map(s => s.service.id);
            if (serviceIds.length === 0) return;

            // Find masters that can provide all selected services
            const data = await api.getAvailableMasters(serviceIds[0], selectedDate || undefined);
            const masters = (data.masters || []).filter((master: Master) => {
                // Check if master provides all selected services
                const masterServiceIds = master.masterServices?.map((ms: MasterService) => ms.serviceId) || [];
                return serviceIds.every(id => masterServiceIds.includes(id));
            });
            setAvailableMasters(masters);
        } catch (err) {
            console.error('Failed to load available masters:', err);
        }
    };

    const loadTimeSlots = async () => {
        if (!selectedMaster || !selectedDate) return;

        try {
            setLoadingSlots(true);
            const data = await api.getSlots(selectedMaster.id, selectedDate, totalDuration);
            setTimeSlots(data.slots || []);
        } catch (err) {
            console.error('Failed to load slots:', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const getServiceName = (service: Service) => {
        return service.name[lang] || service.name.uk || Object.values(service.name)[0];
    };

    const getMasterName = (master: Master) => {
        return master.displayName[lang] || master.displayName.uk || Object.values(master.displayName)[0];
    };

    const handleServiceToggle = (service: Service, duration: ServiceDuration) => {
        const existing = selectedServices.find(
            s => s.service.id === service.id && s.duration.id === duration.id
        );

        if (existing) {
            setSelectedServices(prev => prev.filter(s => s !== existing));
        } else {
            setSelectedServices(prev => [...prev, { service, duration }]);
        }
        setSelectedMaster(null);
        setSelectedTime('');
    };

    const handleMasterSelect = (master: Master | null) => {
        setSelectedMaster(master);
        setSelectedTime('');
    };

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setSelectedTime('');
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handlePromoApply = async () => {
        if (!promoCode.trim()) return;

        try {
            setPromoError(null);
            const data = await api.validatePromoCode(promoCode, totalPrice);
            if (data.promoCode) {
                setPromoDiscount(data.promoCode.discountAmount);
                setPromoApplied(true);
            }
        } catch (err: any) {
            setPromoError(err.message || t('booking.promoInvalid'));
            setPromoApplied(false);
            setPromoDiscount(0);
        }
    };

    const handleBooking = async () => {
        if (!selectedMaster || !selectedDate || !selectedTime || selectedServices.length === 0) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const bookingData = {
                masterId: selectedMaster.id,
                bookingDate: selectedDate,
                startTime: selectedTime,
                serviceDurations: selectedServices.map(s => ({
                    serviceId: s.service.id,
                    durationId: s.duration.id,
                })),
                promoCode: promoApplied ? promoCode : undefined,
            };

            const data = await api.createBooking(bookingData);
            setCreatedBooking(data.booking);
            setBookingSuccess(true);
        } catch (err: any) {
            console.error('Booking failed:', err);
            setError(err.message || t('booking.error.bookingFailed'));
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 'service':
                return selectedServices.length > 0;
            case 'master':
                return selectedMaster !== null;
            case 'datetime':
                return selectedDate && selectedTime;
            case 'confirm':
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        const steps: WizardStep[] = ['service', 'master', 'datetime', 'confirm'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const steps: WizardStep[] = ['service', 'master', 'datetime', 'confirm'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    // Generate dates for next 14 days
    const generateDates = useCallback(() => {
        const dates: string[] = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    };

    const formatTime = (time: string) => {
        return time;
    };

    // Success page
    if (bookingSuccess && createdBooking) {
        return (
            <div className="min-h-screen bg-aurora px-4 py-6 animate-fade-in">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="text-center py-12 max-w-md mx-auto"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                        <span className="text-5xl">✓</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 gradient-text">{t('booking.success')}</h1>
                    <p className="text-white/60 mb-8">{t('booking.successMessage')}</p>

                    <GlassCardStatic variant="elevated" className="p-6 text-left mb-6">
                        <h3 className="font-semibold mb-4 text-white/90">{t('booking.bookingDetails')}</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/50">{t('booking.date')}:</span>
                                <span className="text-white/90">{new Date(createdBooking.bookingDate).toLocaleDateString('uk-UA')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">{t('booking.time')}:</span>
                                <span className="text-white/90">{createdBooking.startTime} - {createdBooking.endTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">{t('booking.master')}:</span>
                                <span className="text-white/90">{getMasterName(createdBooking.master)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-3 border-t border-white/10">
                                <span className="text-white/90">{t('booking.total')}:</span>
                                <span className="text-violet-300">{Number(createdBooking.totalPrice)} ₴</span>
                            </div>
                        </div>
                    </GlassCardStatic>

                    <GradientButton
                        size="lg"
                        onClick={() => navigate('/')}
                        className="w-full"
                    >
                        {t('booking.goHome')}
                    </GradientButton>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-aurora px-4 py-6 animate-fade-in pb-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl font-bold gradient-text">{t('booking.title')}</h1>
                <p className="text-white/50 text-sm mt-1">{t('booking.subtitle')}</p>
            </motion.div>

            {/* Steps Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {(['service', 'master', 'datetime', 'confirm'] as WizardStep[]).map((s, index) => {
                        const isActive = step === s;
                        const isCompleted = index < ['service', 'master', 'datetime', 'confirm'].indexOf(step);
                        return (
                            <div key={s} className="flex items-center flex-1">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: isActive || isCompleted ? 'rgba(139, 92, 246, 1)' : 'rgba(255, 255, 255, 0.1)',
                                        scale: isActive ? 1.1 : 1,
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${isActive ? 'text-white shadow-glow' :
                                        isCompleted ? 'text-white' : 'text-white/50'
                                        }`}
                                >
                                    {isCompleted ? '✓' : index + 1}
                                </motion.div>
                                {index < 3 && (
                                    <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-violet-500' : 'bg-white/10'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/50">
                    <span>{t('booking.steps.service')}</span>
                    <span>{t('booking.steps.master')}</span>
                    <span>{t('booking.steps.datetime')}</span>
                    <span>{t('booking.steps.confirm')}</span>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                {/* Step 1: Services */}
                {step === 'service' && (
                    <motion.div
                        key="service"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-white/90">{t('booking.selectService')}</h2>

                        {loading ? (
                            <div className="text-center py-12 text-white/50">
                                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                {t('common.loading')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {services.map((service, index) => (
                                    <motion.div
                                        key={service.id}
                                        custom={index}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <GlassCardStatic variant="elevated" className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-xl flex items-center justify-center text-2xl border border-white/10">
                                                    💆
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white/90">{getServiceName(service)}</h3>
                                                </div>
                                            </div>
                                            {/* Durations */}
                                            <div className="flex gap-2 flex-wrap mt-4 pl-[72px]">
                                                {service.durations.map((duration) => {
                                                    const isSelected = selectedServices.some(
                                                        s => s.service.id === service.id && s.duration.id === duration.id
                                                    );
                                                    return (
                                                        <button
                                                            key={duration.id}
                                                            onClick={() => handleServiceToggle(service, duration)}
                                                            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isSelected
                                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-glow'
                                                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {duration.durationMinutes} {t('booking.minutes')} • {duration.basePrice} ₴
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </GlassCardStatic>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Selected Summary */}
                        <AnimatePresence>
                            {selectedServices.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    <GlassCardStatic variant="gradient" className="p-5 mt-6">
                                        <h3 className="font-semibold mb-3 text-white/90">{t('booking.selectedServices')}</h3>
                                        {selectedServices.map((s, i) => (
                                            <div key={i} className="flex justify-between text-sm py-2 text-white/70">
                                                <span>{getServiceName(s.service)} ({s.duration.durationMinutes} {t('booking.minutes')})</span>
                                                <span>{s.duration.basePrice} ₴</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold pt-3 mt-2 border-t border-white/10 text-white/90">
                                            <span>{t('booking.total')}</span>
                                            <span className="text-violet-300">{totalPrice} ₴</span>
                                        </div>
                                    </GlassCardStatic>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Step 2: Master */}
                {step === 'master' && (
                    <motion.div
                        key="master"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-white/90">{t('booking.selectMaster')}</h2>

                        {availableMasters.length === 0 ? (
                            <div className="text-center py-12 text-white/50">
                                <div className="text-4xl mb-4">👤</div>
                                {t('booking.noMastersAvailable')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {availableMasters.map((master, index) => (
                                    <motion.div
                                        key={master.id}
                                        custom={index}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <GlassCardStatic
                                            variant={selectedMaster?.id === master.id ? 'gradient' : 'elevated'}
                                            className={`p-4 cursor-pointer transition-all duration-200 ${selectedMaster?.id === master.id ? 'ring-2 ring-violet-400' : ''
                                                }`}
                                            onClick={() => handleMasterSelect(master)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-2xl overflow-hidden border-2 border-white/10">
                                                    {master.photoUrl ? (
                                                        <img src={master.photoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        '👤'
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white/90">{getMasterName(master)}</h3>
                                                    {master.rating > 0 && (
                                                        <div className="flex items-center gap-1 text-sm text-violet-300 mt-1">
                                                            <span>★</span>
                                                            <span>{master.rating.toFixed(1)}</span>
                                                            <span className="text-white/40">({master.reviewCount} {t('booking.reviews')})</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedMaster?.id === master.id && (
                                                    <span className="text-violet-400 text-2xl">✓</span>
                                                )}
                                            </div>
                                        </GlassCardStatic>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 3: Date & Time */}
                {step === 'datetime' && (
                    <motion.div
                        key="datetime"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-white/90 mb-4">{t('booking.selectDate')}</h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {generateDates().map((date) => (
                                    <button
                                        key={date}
                                        onClick={() => handleDateSelect(date)}
                                        className={`px-4 py-3 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${selectedDate === date
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-glow'
                                            : 'glass-card text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        {formatDate(date)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Selection */}
                        <AnimatePresence>
                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <h2 className="text-lg font-semibold text-white/90 mb-4">{t('booking.selectTime')}</h2>

                                    {loadingSlots ? (
                                        <div className="text-center py-12 text-white/50">
                                            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                            {t('booking.loadingSlots')}
                                        </div>
                                    ) : timeSlots.length === 0 ? (
                                        <div className="text-center py-12 text-white/50">
                                            <div className="text-4xl mb-4">🕐</div>
                                            {t('booking.noSlots')}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {timeSlots.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={`py-3 rounded-xl text-sm transition-all duration-200 ${selectedTime === time
                                                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-glow'
                                                        : 'glass-card text-white/70 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {formatTime(time)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {step === 'confirm' && (
                    <motion.div
                        key="confirm"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold text-white/90">{t('booking.summary')}</h2>

                        <GlassCardStatic variant="gradient" className="p-5 space-y-5">
                            {/* Services */}
                            <div>
                                <h3 className="text-sm text-white/50 mb-3">{t('booking.services')}</h3>
                                {selectedServices.map((s, i) => (
                                    <div key={i} className="flex justify-between py-2 text-sm">
                                        <span className="text-white/80">{getServiceName(s.service)} ({s.duration.durationMinutes} {t('booking.minutes')})</span>
                                        <span className="text-white/80">{s.duration.basePrice} ₴</span>
                                    </div>
                                ))}
                            </div>

                            {/* Master */}
                            <div className="flex justify-between py-2 border-t border-white/10">
                                <span className="text-white/50">{t('booking.master')}:</span>
                                <span className="text-white/80">{selectedMaster ? getMasterName(selectedMaster) : '-'}</span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex justify-between py-2">
                                <span className="text-white/50">{t('booking.date')} & {t('booking.time')}:</span>
                                <span className="text-white/80">{selectedDate ? formatDate(selectedDate) : '-'} {selectedTime}</span>
                            </div>

                            {/* Duration */}
                            <div className="flex justify-between py-2">
                                <span className="text-white/50">{t('booking.durationTotal')}:</span>
                                <span className="text-white/80">{totalDuration} {t('booking.minutes')}</span>
                            </div>

                            {/* Promo Code */}
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-sm text-white/50 mb-3">{t('booking.promoCode')}</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder={t('booking.enterPromoCode')}
                                        disabled={promoApplied}
                                        className="flex-1 px-4 py-3 rounded-xl glass-input text-sm text-white/90 placeholder:text-white/30"
                                    />
                                    {!promoApplied ? (
                                        <GradientButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={handlePromoApply}
                                            disabled={!promoCode.trim()}
                                        >
                                            {t('booking.apply')}
                                        </GradientButton>
                                    ) : (
                                        <span className="px-4 py-3 text-green-400 text-sm flex items-center">
                                            ✓ {t('booking.promoApplied')}
                                        </span>
                                    )}
                                </div>
                                {promoError && (
                                    <p className="text-red-400 text-sm mt-2">{promoError}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between py-1 text-sm">
                                    <span className="text-white/50">{t('booking.subtotal')}:</span>
                                    <span className="text-white/80">{totalPrice} ₴</span>
                                </div>
                                {promoDiscount > 0 && (
                                    <div className="flex justify-between py-1 text-green-400 text-sm">
                                        <span>{t('booking.discount')}:</span>
                                        <span>-{promoDiscount} ₴</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 font-bold text-lg border-t border-white/10 pt-3">
                                    <span className="text-white/90">{t('booking.total')}:</span>
                                    <span className="text-violet-300">{finalPrice} ₴</span>
                                </div>
                            </div>
                        </GlassCardStatic>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20">
                <div className="flex gap-3 max-w-lg mx-auto">
                    {step !== 'service' && (
                        <GradientButton
                            variant="ghost"
                            size="md"
                            onClick={prevStep}
                            className="flex-1"
                        >
                            {t('common.back')}
                        </GradientButton>
                    )}
                    <GradientButton
                        size="md"
                        onClick={step === 'confirm' ? handleBooking : nextStep}
                        disabled={!canProceed() || loading}
                        className="flex-1"
                        loading={loading}
                    >
                        {step === 'confirm' ? t('booking.bookNow') : t('common.next')}
                    </GradientButton>
                </div>
            </div>
        </div>
    );
}
