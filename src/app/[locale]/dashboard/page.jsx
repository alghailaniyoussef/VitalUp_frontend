'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { useUser } from '@/context/UserContext';
import WelcomeModal from '@/components/WelcomeModal';

export default function Dashboard() {
    const { user, isLoading: userLoading } = useUser();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const router = useRouter();
    const { t, locale } = useI18n();

    // Show welcome modal only on new login
    useEffect(() => {
        if (user && !userLoading) {
            // Check if welcome modal should be shown from login redirect
            const shouldShowWelcome = localStorage.getItem('showWelcomeModal');
            if (shouldShowWelcome === 'true') {
                setShowWelcomeModal(true);
                localStorage.removeItem('showWelcomeModal');
            }
        }
    }, [user, userLoading]);

    useEffect(() => {
        // Wait for UserContext to finish loading
        if (userLoading) return;
        
        // If no user is authenticated, redirect to signin
        if (!user) {
            router.push(`/${locale}/auth/signin`);
            return;
        }

        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    router.push(`/${locale}/auth/signin`);
                    return;
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard-data`, {
                    method: 'GET',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept-Language': locale
                    },
                });

                if (!res.ok) throw new Error('Failed to fetch dashboard data');
                const data = await res.json();
                setDashboard(data);
            } catch (err) {
                console.error('❌ Error loading dashboard:', err);
                router.push(`/${locale}/auth/signin`);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [user, userLoading, locale, router]);

    if (userLoading || loading) {
        return <p className="text-center text-green-700 mt-20 text-xl">{t('dashboard.loading')}</p>;
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <section className="min-h-screen bg-gradient-to-br from-dashboard-bg via-primary-50 to-dashboard-bg px-6 py-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-dashboard-card via-white to-dashboard-card shadow-soft rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center border border-dashboard-border/50 backdrop-blur-sm">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-dashboard-text via-dashboard-accent to-dashboard-text bg-clip-text text-transparent">
                            {t('dashboard.welcome', { name: user?.name })}
                        </h1>
                        <p className="text-dashboard-text/80 mt-2 text-lg font-medium">{t('dashboard.subtitle')}</p>
                        <div className="flex items-center mt-3 justify-center md:justify-start">
                            <span className="text-2xl mr-2">🌟</span>
                            <span className="text-dashboard-accent font-semibold">{t('common.levelNumber', { level: dashboard?.level ?? 1 })}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push(`/${locale}/profile`)} 
                        className="mt-6 md:mt-0 bg-gradient-to-r from-dashboard-accent via-primary-500 to-dashboard-accent hover:from-primary-600 hover:via-dashboard-accent hover:to-primary-600 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-glow hover:shadow-xl font-bold tracking-wide transform hover:scale-105"
                    >
                        {t('dashboard.editProfile')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-primary-50 p-8 rounded-2xl text-center shadow-soft border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 animate-slide-up group hover:scale-105">
                        <div className="bg-gradient-to-br from-dashboard-accent to-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-2xl text-white">💎</span>
                        </div>
                        <h3 className="text-lg font-bold text-dashboard-text/90 mb-2">{t('dashboard.totalPoints')}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-dashboard-accent to-primary-600 bg-clip-text text-transparent">{dashboard?.points ?? 0}</p>
                        <div className="mt-2 text-sm text-dashboard-text/60 font-medium">{t('common.totalEarned')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-secondary-50 p-8 rounded-2xl text-center shadow-soft border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 animate-slide-up group hover:scale-105">
                        <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-2xl text-white">🏆</span>
                        </div>
                        <h3 className="text-lg font-bold text-dashboard-text/90 mb-2">{t('dashboard.level')}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-secondary-500 to-secondary-600 bg-clip-text text-transparent">{dashboard?.level ?? 1}</p>
                        <div className="mt-2 text-sm text-dashboard-text/60 font-medium">{t('common.currentLevel')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-primary-50 p-8 rounded-2xl text-center shadow-soft border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 animate-slide-up group hover:scale-105">
                        <div className="bg-gradient-to-br from-primary-500 to-dashboard-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-2xl text-white">🎖️</span>
                        </div>
                        <h3 className="text-lg font-bold text-dashboard-text/90 mb-2">{t('dashboard.badges')}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-dashboard-accent bg-clip-text text-transparent">{dashboard?.badges_count ?? 0}</p>
                        <div className="mt-2 text-sm text-dashboard-text/60 font-medium">{t('common.achievements')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-secondary-50 p-8 rounded-2xl text-center shadow-soft border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 animate-slide-up group hover:scale-105">
                        <div className="bg-gradient-to-br from-secondary-400 to-primary-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-2xl text-white">✨</span>
                        </div>
                        <h3 className="text-lg font-bold text-dashboard-text/90 mb-2">{t('dashboard.challenges')}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-secondary-400 to-primary-500 bg-clip-text text-transparent">{dashboard?.completed_challenges ?? 0}</p>
                        <div className="mt-2 text-sm text-dashboard-text/60 font-medium">{t('common.completed')}</div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Recent Quizzes */}
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-primary-50 rounded-2xl shadow-soft p-8 border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 group">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-br from-dashboard-accent to-primary-600 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white text-lg">🧠</span>
                                </div>
                                <h2 className="text-2xl font-bold text-dashboard-text">{t('dashboard.recentQuizzes')}</h2>
                            </div>
                            <Link href={`/${locale}/quiz`} className="bg-gradient-to-r from-dashboard-accent to-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-md">{t('dashboard.viewAll')}</Link>
                        </div>
                        <div className="space-y-4">
                            {(dashboard?.recent_quizzes ?? []).map((quiz, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-primary-50 rounded-xl border border-dashboard-border/20 hover:shadow-md transition-all duration-200 group">
                                    <span className="font-bold text-dashboard-text group-hover:text-dashboard-accent transition-colors">{quiz.title}</span>
                                    <div className="flex items-center">
                                        <span className="text-dashboard-accent font-bold text-lg mr-2">{quiz.score}%</span>
                                        <div className="w-2 h-2 bg-dashboard-accent rounded-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Challenges */}
                    <div className="bg-gradient-to-br from-dashboard-card via-white to-secondary-50 rounded-2xl shadow-soft p-8 border border-dashboard-border/30 hover:shadow-glow transition-all duration-300 group">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white text-lg">💪</span>
                                </div>
                                <h2 className="text-2xl font-bold text-dashboard-text">{t('dashboard.activeChallenges')}</h2>
                            </div>
                            <Link href={`/${locale}/challenges`} className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-md">{t('dashboard.viewAll')}</Link>
                        </div>
                        <div className="space-y-4">
                            {(dashboard?.active_challenges ?? []).map((challenge, i) => (
                                <div key={i} className="p-4 bg-gradient-to-r from-white to-secondary-50 rounded-xl border border-dashboard-border/20 hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-dashboard-text">{challenge.title}</span>
                                        <span className="text-sm text-secondary-600 font-bold bg-secondary-100 px-3 py-1 rounded-full">{challenge.progress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary-200 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-3 rounded-full transition-all duration-500 shadow-sm" 
                                            style={{ width: `${challenge.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Badges Showcase */}
                <div className="bg-gradient-to-br from-dashboard-card via-white to-gamified-50 rounded-2xl shadow-soft p-8 border border-dashboard-border/30 hover:shadow-glow transition-all duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-br from-gamified-accent to-gamified-info w-12 h-12 rounded-full flex items-center justify-center mr-4">
                                <span className="text-white text-xl">🏆</span>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-dashboard-text via-gamified-accent to-dashboard-text bg-clip-text text-transparent">{t('dashboard.badgesShowcase')}</h2>
                        </div>
                        <Link href={`/${locale}/badges`} className="bg-gradient-to-r from-gamified-accent to-gamified-info text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-lg">{t('dashboard.viewAll')}</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {(dashboard?.recent_badges ?? []).map((badge, i) => (
                            <div key={i} className="text-center p-6 bg-gradient-to-br from-white via-gamified-50 to-white rounded-2xl border border-gamified-border/30 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{badge.icon}</div>
                                <h3 className="font-bold text-dashboard-text text-sm mb-2 group-hover:text-gamified-accent transition-colors">{badge.name}</h3>
                                <p className="text-xs text-gamified-text bg-gamified-100 px-3 py-1 rounded-full">{badge.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Tip */}
                <div className="bg-dashboard-card rounded-xl shadow-soft p-6 border border-dashboard-border hover:shadow-glow transition-all duration-200">
                    <h2 className="text-xl font-bold text-dashboard-text mb-4">{t('dashboard.dailyTip')}</h2>
                    <p className="text-dashboard-text/80 leading-relaxed">
                        {dashboard?.tip ?? t('dashboard.defaultTip')}
                    </p>
                </div>
            </div>

            {/* Welcome Modal */}
            <WelcomeModal 
                isOpen={showWelcomeModal}
                onClose={() => setShowWelcomeModal(false)}
                userName={user?.name || ''}
            />
        </section>
    );
}
