import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../shared/api/client';
import { useTranslatedContent } from '../../shared/hooks/useTranslatedContent';

// Types
interface Service {
    id: string;
    name: Record<string, string>;
    imageUrl: string | null;
    durations: Array<{ price: number }>;
}

interface Master {
    id: string;
    displayName: string;
    photoUrl: string | null;
    rating: number;
    reviewCount: number;
}

interface Promotion {
    id: string;
    title: Record<string, string>;
    description: Record<string, string> | null;
    imageUrl: string | null;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    user: {
        firstName: string | null;
        avatarUrl: string | null;
    };
    master: {
        displayName: string;
    };
}

interface ServicesResponse {
    services: Service[];
}

interface MastersResponse {
    masters: Master[];
}

interface PromotionsResponse {
    promotions: Promotion[];
}

interface ReviewsResponse {
    reviews: Review[];
}

// Google Maps configuration
const MAP_CONFIG = {
    lat: 50.4501, // Kyiv coordinates (placeholder - replace with actual salon coordinates)
    lng: 30.5234,
    address: 'вул. Хрещатик, 1, Київ',
};

export function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { t: tContent } = useTranslatedContent();

    // Data states
    const [services, setServices] = useState<Service[]>([]);
    const [masters, setMasters] = useState<Master[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch services
                const servicesData = await api.get<ServicesResponse>('/services');
                setServices(servicesData.services || []);

                // Fetch masters
                const mastersData = await api.get<MastersResponse>('/masters');
                setMasters(mastersData.masters || []);

                // Fetch promotions
                const promotionsData = await api.get<PromotionsResponse>('/promotions');
                setPromotions(promotionsData.promotions || []);

                // Fetch reviews
                const reviewsData = await api.get<ReviewsResponse>('/reviews?limit=6');
                setReviews(reviewsData.reviews || []);

                setError(null);
            } catch (err) {
                console.error('Failed to fetch home page data:', err);
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [t]);

    // Get minimum price from service durations
    const getMinPrice = (service: Service): number | null => {
        if (!service.durations || service.durations.length === 0) return null;
        const prices = service.durations.map((d) => d.price).filter((p) => p > 0);
        return prices.length > 0 ? Math.min(...prices) : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-[var(--color-hint)]">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative h-64 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white rounded-b-3xl overflow-hidden">
                <div className="text-center px-6 z-10">
                    <motion.h1
                        className="text-3xl font-bold mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('home.hero.title')}
                    </motion.h1>
                    <motion.p
                        className="text-lg opacity-90"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('home.hero.subtitle')}
                    </motion.p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full" />
            </section>

            {/* About Section */}
            <section className="px-4 py-8">
                <h2 className="text-xl font-bold mb-3">{t('home.about.title')}</h2>
                <p className="text-[var(--color-hint)] leading-relaxed">
                    {t('home.about.description')}
                </p>
            </section>

            {/* Promotions Carousel */}
            <section className="px-4 py-4">
                <h2 className="text-xl font-bold mb-4">{t('home.promotions.title')}</h2>
                {promotions.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {promotions.map((promotion) => (
                            <div
                                key={promotion.id}
                                className="min-w-[280px] h-40 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-2xl flex items-center justify-center text-white font-bold snap-start p-4"
                            >
                                <div className="text-center">
                                    <span className="block text-lg">{tContent(promotion.title)}</span>
                                    {promotion.description && (
                                        <span className="block text-sm opacity-80 mt-1">
                                            {tContent(promotion.description)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[var(--color-hint)] text-sm">
                        {t('common.noResults')}
                    </div>
                )}
            </section>

            {/* Services Carousel */}
            <section className="px-4 py-4">
                <h2 className="text-xl font-bold mb-4">{t('home.services.title')}</h2>
                {services.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                        {services.slice(0, 6).map((service) => {
                            const minPrice = getMinPrice(service);
                            return (
                                <div
                                    key={service.id}
                                    className="min-w-[160px] bg-[var(--color-secondary-bg)] rounded-2xl p-4 snap-start"
                                >
                                    <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-xl mb-3 flex items-center justify-center text-2xl overflow-hidden">
                                        {service.imageUrl ? (
                                            <img
                                                src={service.imageUrl}
                                                alt={tContent(service.name)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            '💆'
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                                        {tContent(service.name)}
                                    </h3>
                                    {minPrice && (
                                        <p className="text-xs text-[var(--color-hint)]">
                                            {t('home.services.from')} {minPrice} ₴
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-[var(--color-hint)] text-sm">
                        {t('common.noResults')}
                    </div>
                )}
            </section>

            {/* Masters Carousel */}
            <section className="px-4 py-4">
                <h2 className="text-xl font-bold mb-4">{t('home.masters.title')}</h2>
                {masters.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                        {masters.slice(0, 6).map((master) => (
                            <div
                                key={master.id}
                                className="min-w-[140px] bg-[var(--color-secondary-bg)] rounded-2xl p-4 text-center snap-start"
                            >
                                <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl overflow-hidden">
                                    {master.photoUrl ? (
                                        <img
                                            src={master.photoUrl}
                                            alt={master.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        '👩‍⚕️'
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm">{master.displayName}</h3>
                                <p className="text-xs text-[var(--color-hint)]">
                                    ⭐ {master.rating.toFixed(1)} ({master.reviewCount} {t('home.masters.reviews')})
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[var(--color-hint)] text-sm">
                        {t('common.noResults')}
                    </div>
                )}
            </section>

            {/* Reviews Carousel */}
            <section className="px-4 py-4">
                <h2 className="text-xl font-bold mb-4">{t('home.reviews.title')}</h2>
                {reviews.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="min-w-[260px] bg-[var(--color-secondary-bg)] rounded-2xl p-4 snap-start"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center text-sm overflow-hidden">
                                        {review.user.avatarUrl ? (
                                            <img
                                                src={review.user.avatarUrl}
                                                alt={review.user.firstName || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            (review.user.firstName?.[0] || '?')
                                        )}
                                    </div>
                                    <span className="font-semibold text-sm">
                                        {review.user.firstName || 'Анонім'}
                                    </span>
                                </div>
                                <div className="text-yellow-500 text-sm mb-2">
                                    {'⭐'.repeat(review.rating)}
                                </div>
                                <p className="text-xs text-[var(--color-hint)] line-clamp-3">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[var(--color-hint)] text-sm">
                        {t('common.noResults')}
                    </div>
                )}
            </section>

            {/* Map Section */}
            <section className="px-4 py-4">
                <h2 className="text-xl font-bold mb-4">{t('home.map.title')}</h2>
                <div className="h-48 bg-[var(--color-secondary-bg)] rounded-2xl overflow-hidden">
                    <iframe
                        title="Google Maps"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${MAP_CONFIG.lat},${MAP_CONFIG.lng}&zoom=15`}
                    />
                </div>
                <p className="text-sm text-[var(--color-hint)] mt-2 text-center">
                    {MAP_CONFIG.address}
                </p>
            </section>

            {/* CTA Button */}
            <div className="px-4 py-6">
                <motion.button
                    onClick={() => navigate('/booking')}
                    className="w-full py-4 bg-[var(--color-btn)] text-[var(--color-btn-text)] rounded-2xl font-bold text-lg shadow-lg"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                >
                    {t('home.hero.cta')}
                </motion.button>
            </div>

            {/* Error message */}
            {error && (
                <div className="px-4 py-2 text-red-500 text-center text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
