import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../shared/api/client';
import type { Service, Master, ServiceDuration, MasterService } from '../../shared/api/types';

// Types for booking wizard
interface SelectedService {
    service: Service;
    duration: ServiceDuration;
}

type WizardStep = 'service' | 'master' | 'datetime' | 'confirm';

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
            <div className="px-4 py-6 animate-fade-in">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">✓</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{t('booking.success')}</h1>
                    <p className="text-[var(--color-hint)] mb-8">{t('booking.successMessage')}</p>

                    <div className="bg-[var(--color-secondary-bg)] rounded-2xl p-4 text-left mb-6">
                        <h3 className="font-semibold mb-3">{t('booking.bookingDetails')}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-hint)]">{t('booking.date')}:</span>
                                <span>{new Date(createdBooking.bookingDate).toLocaleDateString('uk-UA')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-hint)]">{t('booking.time')}:</span>
                                <span>{createdBooking.startTime} - {createdBooking.endTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-hint)]">{t('booking.master')}:</span>
                                <span>{getMasterName(createdBooking.master)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-[var(--color-border)]">
                                <span>{t('booking.total')}:</span>
                                <span>{Number(createdBooking.totalPrice)} ₴</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl font-semibold"
                    >
                        {t('booking.goHome')}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">{t('booking.title')}</h1>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-8">
                {(['service', 'master', 'datetime', 'confirm'] as WizardStep[]).map((s, index) => (
                    <div key={s} className="flex items-center flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step === s
                                ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                                : index < ['service', 'master', 'datetime', 'confirm'].indexOf(step)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-[var(--color-secondary-bg)] text-[var(--color-hint)]'
                                }`}
                        >
                            {index < ['service', 'master', 'datetime', 'confirm'].indexOf(step) ? '✓' : index + 1}
                        </div>
                        {index < 3 && (
                            <div className={`flex-1 h-0.5 mx-2 ${index < ['service', 'master', 'datetime', 'confirm'].indexOf(step)
                                ? 'bg-green-500'
                                : 'bg-[var(--color-secondary-bg)]'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
                {/* Step 1: Services */}
                {step === 'service' && (
                    <motion.div
                        key="service"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold">{t('booking.selectService')}</h2>

                        {loading ? (
                            <div className="text-center py-8 text-[var(--color-hint)]">
                                {t('common.loading')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {services.map((service) => (
                                    <div key={service.id}>
                                        <div className="flex items-center gap-3 p-3">
                                            <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-xl flex items-center justify-center text-2xl">
                                                💆
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{getServiceName(service)}</h3>
                                            </div>
                                        </div>
                                        {/* Durations */}
                                        <div className="ml-15 pl-15 flex gap-2 flex-wrap mt-2">
                                            {service.durations.map((duration) => {
                                                const isSelected = selectedServices.some(
                                                    s => s.service.id === service.id && s.duration.id === duration.id
                                                );
                                                return (
                                                    <button
                                                        key={duration.id}
                                                        onClick={() => handleServiceToggle(service, duration)}
                                                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                                            ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                                                            : 'bg-[var(--color-secondary-bg)] text-[var(--color-hint)]'
                                                            }`}
                                                    >
                                                        {duration.durationMinutes} {t('booking.minutes')} • {duration.basePrice} ₴
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Summary */}
                        {selectedServices.length > 0 && (
                            <div className="mt-6 p-4 bg-[var(--color-secondary-bg)] rounded-2xl">
                                <h3 className="font-semibold mb-2">{t('booking.selectedServices')}</h3>
                                {selectedServices.map((s, i) => (
                                    <div key={i} className="flex justify-between text-sm py-1">
                                        <span>{getServiceName(s.service)} ({s.duration.durationMinutes} {t('booking.minutes')})</span>
                                        <span>{s.duration.basePrice} ₴</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold pt-2 mt-2 border-t border-[var(--color-border)]">
                                    <span>{t('booking.total')}</span>
                                    <span>{totalPrice} ₴</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 2: Master */}
                {step === 'master' && (
                    <motion.div
                        key="master"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold">{t('booking.selectMaster')}</h2>

                        {availableMasters.length === 0 ? (
                            <div className="text-center py-8 text-[var(--color-hint)]">
                                {t('booking.noMastersAvailable')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availableMasters.map((master) => (
                                    <div
                                        key={master.id}
                                        onClick={() => handleMasterSelect(master)}
                                        className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${selectedMaster?.id === master.id
                                            ? 'bg-[var(--color-btn)]/10 ring-2 ring-[var(--color-btn)]'
                                            : 'bg-[var(--color-secondary-bg)]'
                                            }`}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-2xl overflow-hidden">
                                            {master.photoUrl ? (
                                                <img src={master.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                '👤'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{getMasterName(master)}</h3>
                                            {master.rating > 0 && (
                                                <div className="flex items-center gap-1 text-sm text-[var(--color-hint)]">
                                                    <span>⭐</span>
                                                    <span>{master.rating.toFixed(1)}</span>
                                                    <span>({master.reviewCount} {t('booking.reviews')})</span>
                                                </div>
                                            )}
                                        </div>
                                        {selectedMaster?.id === master.id && (
                                            <span className="text-[var(--color-btn)]">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 3: Date & Time */}
                {step === 'datetime' && (
                    <motion.div
                        key="datetime"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold">{t('booking.selectDate')}</h2>

                        {/* Date Selection */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {generateDates().map((date) => (
                                <button
                                    key={date}
                                    onClick={() => handleDateSelect(date)}
                                    className={`px-4 py-3 rounded-xl text-sm whitespace-nowrap transition-colors ${selectedDate === date
                                        ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                                        : 'bg-[var(--color-secondary-bg)]'
                                        }`}
                                >
                                    {formatDate(date)}
                                </button>
                            ))}
                        </div>

                        {/* Time Selection */}
                        {selectedDate && (
                            <>
                                <h2 className="text-lg font-semibold mt-6">{t('booking.selectTime')}</h2>

                                {loadingSlots ? (
                                    <div className="text-center py-8 text-[var(--color-hint)]">
                                        {t('booking.loadingSlots')}
                                    </div>
                                ) : timeSlots.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--color-hint)]">
                                        {t('booking.noSlots')}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => handleTimeSelect(time)}
                                                className={`py-3 rounded-xl text-sm transition-colors ${selectedTime === time
                                                    ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                                                    : 'bg-[var(--color-secondary-bg)]'
                                                    }`}
                                            >
                                                {formatTime(time)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {/* Step 4: Confirmation */}
                {step === 'confirm' && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-semibold">{t('booking.summary')}</h2>

                        <div className="bg-[var(--color-secondary-bg)] rounded-2xl p-4 space-y-4">
                            {/* Services */}
                            <div>
                                <h3 className="text-sm text-[var(--color-hint)] mb-2">{t('booking.services')}</h3>
                                {selectedServices.map((s, i) => (
                                    <div key={i} className="flex justify-between py-1">
                                        <span>{getServiceName(s.service)} ({s.duration.durationMinutes} {t('booking.minutes')})</span>
                                        <span>{s.duration.basePrice} ₴</span>
                                    </div>
                                ))}
                            </div>

                            {/* Master */}
                            <div className="flex justify-between py-1">
                                <span className="text-[var(--color-hint)]">{t('booking.master')}:</span>
                                <span>{selectedMaster ? getMasterName(selectedMaster) : '-'}</span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex justify-between py-1">
                                <span className="text-[var(--color-hint)]">{t('booking.date')} {t('booking.time')}:</span>
                                <span>{selectedDate ? formatDate(selectedDate) : '-'} {selectedTime}</span>
                            </div>

                            {/* Duration */}
                            <div className="flex justify-between py-1">
                                <span className="text-[var(--color-hint)]">{t('booking.durationTotal')}:</span>
                                <span>{totalDuration} {t('booking.minutes')}</span>
                            </div>

                            {/* Promo Code */}
                            <div className="pt-4 border-t border-[var(--color-border)]">
                                <h3 className="text-sm text-[var(--color-hint)] mb-2">{t('booking.promoCode')}</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder={t('booking.enterPromoCode')}
                                        disabled={promoApplied}
                                        className="flex-1 px-4 py-2 rounded-xl bg-white border border-[var(--color-border)] text-sm"
                                    />
                                    {!promoApplied ? (
                                        <button
                                            onClick={handlePromoApply}
                                            disabled={!promoCode.trim()}
                                            className="px-4 py-2 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-xl text-sm font-medium disabled:opacity-50"
                                        >
                                            {t('booking.apply')}
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 text-green-600 text-sm">✓ {t('booking.promoApplied')}</span>
                                    )}
                                </div>
                                {promoError && (
                                    <p className="text-red-500 text-sm mt-2">{promoError}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="pt-4 border-t border-[var(--color-border)]">
                                <div className="flex justify-between py-1">
                                    <span className="text-[var(--color-hint)]">{t('booking.subtotal')}:</span>
                                    <span>{totalPrice} ₴</span>
                                </div>
                                {promoDiscount > 0 && (
                                    <div className="flex justify-between py-1 text-green-600">
                                        <span>{t('booking.discount')}:</span>
                                        <span>-{promoDiscount} ₴</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 font-bold text-lg">
                                    <span>{t('booking.total')}:</span>
                                    <span>{finalPrice} ₴</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
                {step !== 'service' && (
                    <button
                        onClick={prevStep}
                        className="flex-1 py-4 bg-[var(--color-secondary-bg)] rounded-xl font-semibold"
                    >
                        {t('common.back')}
                    </button>
                )}
                <button
                    onClick={step === 'confirm' ? handleBooking : nextStep}
                    disabled={!canProceed() || loading}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-colors ${canProceed()
                        ? 'bg-[var(--color-btn)] text-[var(--color-btn-text)]'
                        : 'bg-[var(--color-secondary-bg)] text-[var(--color-hint)]'
                        }`}
                >
                    {loading ? t('common.loading') : step === 'confirm' ? t('booking.bookNow') : t('common.next')}
                </button>
            </div>
        </div>
    );
}
