import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../shared/api/client';
import { GlassCard, GlassCardStatic } from '../../shared/components/ui/GlassCard';
import { SectionHeader, SectionHeaderStatic } from '../../shared/components/ui/SectionHeader';
import { GradientButton } from '../../shared/components/ui/GradientButton';

// Animated background particles
const ParticleBackground = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
                className="absolute top-20 left-10 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]"
                animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-40 right-10 w-80 h-80 bg-pink-600/20 rounded-full blur-[100px]"
                animate={{ x: [0, -40, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]"
                animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
};

export function HomePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [services, setServices] = useState<any[]>([]);
    const [masters, setMasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [servicesData, mastersData] = await Promise.all([
                api.getServices(),
                api.getMasters(),
            ]);
            setServices(servicesData.services || []);
            setMasters(mastersData.masters || []);
        } catch (error: any) {
            console.error('Failed to load home data:', error);
            if (error?.response?.status === 401) {
                setIsAuthenticated(false);
            }
        } finally {
            setLoading(false);
        }
    };

    // Sample team photos
    const teamPhotos = [
        { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&h=400&fit=crop', name: 'Anna' },
        { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop', name: 'Maria' },
        { url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', name: 'Sophie' },
        { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', name: 'Elena' },
    ];

    const getLocalizedName = (obj: any, lang: string) => {
        if (!obj) return '';
        return obj[lang] || obj['uk'] || obj['en'] || Object.values(obj)[0] || '';
    };

    return (
        <div className="min-h-screen bg-aurora overflow-x-hidden pb-24">
            <ParticleBackground />

            {/* Auth Warning */}
            {!isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 left-4 right-4 z-50"
                >
                    <GlassCardStatic variant="bordered" className="p-4 border-amber-500/50">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="text-white/90 font-medium">Для повного доступу відкрийте через Telegram</p>
                                <p className="text-white/50 text-sm">Авторизуйтесь для перегляду профілю</p>
                            </div>
                        </div>
                    </GlassCardStatic>
                </motion.div>
            )}

            {/* Hero Section */}
            <section className="relative min-h-[70vh] flex items-center justify-center px-4 pt-20 pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 blur-2xl opacity-50" />
                        <div className="relative glass-card px-6 py-3 rounded-2xl">
                            <span className="text-3xl font-bold gradient-text">✨ Massage Pro</span>
                        </div>
                    </div>
                </motion.div>

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            {t('home.title')} <span className="gradient-text">{t('home.titleHighlight')}</span>
                        </h1>
                    </motion.div>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl mx-auto">
                        {t('home.subtitle')}
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
                        <GradientButton onClick={() => navigate('/booking')} size="lg" className="text-lg px-10">
                            {t('home.ctaButton')}
                        </GradientButton>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <motion.div className="w-1.5 h-1.5 bg-white/50 rounded-full" animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                </motion.div>
            </section>

            {/* Team Section */}
            <section className="relative z-10 px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <SectionHeaderStatic title={t('home.team.title', 'Наша команда')} subtitle={t('home.team.subtitle', 'Професіонали з досвідом')} className="mb-10" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {teamPhotos.map((photo, index) => (
                            <GlassCard key={index} variant="elevated" className="overflow-hidden group" delay={index * 0.1}>
                                <div className="relative aspect-square">
                                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-white font-medium text-sm">{photo.name}</p>
                                        <p className="text-white/60 text-xs">Масажист</p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="relative z-10 px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <SectionHeaderStatic title={t('home.services.title', 'Наші послуги')} subtitle={t('home.services.subtitle', 'Оберіть послугу для відпочинку')} className="mb-10" />

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 glass-card animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.slice(0, 6).map((service: any, index) => (
                                <GlassCard key={service.id} variant="elevated" className="p-5 cursor-pointer group" onClick={() => navigate('/booking')} delay={index * 0.1}>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">
                                            {getLocalizedName(service.name, i18n.language)}
                                        </h3>
                                        <span className="text-violet-400 font-bold">{service.price} ₴</span>
                                    </div>
                                    <p className="text-white/50 text-sm line-clamp-2">{getLocalizedName(service.description, i18n.language)}</p>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Masters Section */}
            <section className="relative z-10 px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <SectionHeaderStatic title={t('home.masters.title', 'Наші майстри')} subtitle={t('home.masters.subtitle', 'Кращі спеціалісти')} className="mb-10" />

                    {loading ? (
                        <div className="flex gap-4 overflow-hidden">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-64 h-80 glass-card animate-pulse flex-shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                            {masters.slice(0, 6).map((master: any, index) => (
                                <div key={master.id} className="w-64 flex-shrink-0 snap-start">
                                    <GlassCard variant="gradient" className="h-full overflow-hidden" delay={index * 0.1}>
                                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center text-6xl">
                                            💆
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold text-white mb-1">Майстер #{index + 1}</h3>
                                            <div className="flex items-center gap-1 text-amber-400 text-sm mb-2">
                                                <span>⭐ {master.rating?.toFixed(1) || '5.0'}</span>
                                            </div>
                                            <p className="text-white/50 text-sm line-clamp-2">{getLocalizedName(master.bio, i18n.language)}</p>
                                        </div>
                                    </GlassCard>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-4 py-20">
                <div className="max-w-3xl mx-auto text-center">
                    <GlassCard variant="gradient" className="p-8 md:p-12">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('home.cta.title', 'Готові до відпочинку?')}</h2>
                            <p className="text-white/60 mb-8 text-lg">{t('home.cta.subtitle', 'Запишіться зараз та отримайте знижку 10% на перший візит')}</p>
                            <GradientButton onClick={() => navigate('/booking')} size="lg" className="text-lg px-12">
                                {t('home.cta.button', 'Записатись зараз')}
                            </GradientButton>
                        </motion.div>
                    </GlassCard>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-4 py-8 border-t border-white/10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="glass-card inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4">
                        <span className="text-2xl">✨</span>
                        <span className="font-bold gradient-text">Massage Pro</span>
                    </div>
                    <p className="text-white/40 text-sm">© 2024 Massage Pro. Всі права захищені.</p>
                </div>
            </footer>
        </div>
    );
}
