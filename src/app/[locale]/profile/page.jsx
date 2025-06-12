'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import PointsHistory from '@/components/PointsHistory';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, isLoading } = useUser();
    const { t, locale } = useI18n();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const predefinedIcons = [
        { name: t('icons.trophy'), icon: '🏆', value: 'trophy' },
        { name: t('icons.medal'), icon: '🏅', value: 'medal' },
        { name: t('icons.star'), icon: '⭐', value: 'star' },
        { name: t('icons.crown'), icon: '👑', value: 'crown' },
        { name: t('icons.fire'), icon: '🔥', value: 'fire' },
        { name: t('icons.lightning'), icon: '⚡', value: 'lightning' },
        { name: t('icons.diamond'), icon: '💎', value: 'diamond' },
        { name: t('icons.shield'), icon: '🛡️', value: 'shield' },
        { name: t('icons.target'), icon: '🎯', value: 'target' },
        { name: t('icons.rocket'), icon: '🚀', value: 'rocket' },
        { name: t('icons.brain'), icon: '🧠', value: 'brain' },
        { name: t('icons.heart'), icon: '❤️', value: 'heart' },
        { name: t('icons.muscle'), icon: '💪', value: 'muscle' },
        { name: t('icons.book'), icon: '📚', value: 'book' },
        { name: t('icons.graduation'), icon: '🎓', value: 'graduation' },
        { name: t('icons.checkmark'), icon: '✅', value: 'checkmark' }
    ];

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push(`/${locale}/auth/signin`);
                setError(t('profile.errors.noToken'));
                setLoading(false);
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch profile data');
            }
            
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            console.error('❌ Error loading profile:', err);
            setError(t('profile.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        setLoading(true);
        await fetchProfile();
    };

    useEffect(() => {
        if (!isLoading && !user) {
            router.push(`/${locale}/auth/signin`);
            return;
        }

        if (user) {
            fetchProfile();
        }
    }, [user, isLoading, router]);

    if (isLoading || loading) {
        return <p className="text-center text-personal-accent mt-20 text-xl">{t('profile.loading')}</p>;
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-personal-bg via-primary-50 to-personal-bg py-12">
            <div className="container mx-auto px-6 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-soft">
                            <span className="text-white text-2xl">👤</span>
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent">{t('profile.title')}</h1>
                    </div>
                    <p className="text-xl text-personal-text/80 bg-personal-card/50 backdrop-blur-sm px-8 py-4 rounded-2xl border border-personal-border/30 max-w-3xl mx-auto">{t('profile.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-personal-error/20 border-l-4 border-personal-error p-4">
                        <p className="text-personal-error">{error}</p>
                    </div>
                )}

                {profile && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Información Personal */}
                        <div className="md:col-span-1">
                            <div className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-8 border border-personal-border/30">
                                <div className="flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-glow">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent mb-2">{user.name}</h2>
                                    <p className="text-personal-text/70 text-lg">{user.email}</p>
                                    <div className="mt-6 text-center bg-personal-card/30 backdrop-blur-sm p-4 rounded-xl border border-personal-border/20">
                                        <p className="text-sm text-personal-text/60 font-semibold">{t('profile.memberSince')}</p>
                                        <p className="font-bold text-xl text-personal-accent mt-1">
                                            {new Date(profile.created_at).toLocaleDateString(locale)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-personal-border/30">
                                    <button
                                        onClick={() => router.push(`/${locale}/settings`)}
                                        className="w-full py-4 bg-gradient-to-r from-personal-accent via-personal-info to-personal-accent hover:from-personal-accent/90 hover:to-personal-accent/90 text-white rounded-xl transition shadow-personal hover:shadow-glow font-bold text-lg transform hover:scale-105"
                                    >
                                        <span className="mr-2">⚙️</span>
                                        {t('profile.buttons.editPreferences')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas y Progreso */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Nivel y Puntos */}
                            <div className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-8 border border-personal-border/30">
                                <div className="flex items-center mb-6">
                                    <div className="bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent p-3 rounded-full mr-4 shadow-soft">
                                        <span className="text-white text-xl">📊</span>
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent">{t('profile.sections.levelProgress')}</h3>
                                </div>
                                <div className="flex items-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent flex items-center justify-center text-white text-3xl font-bold mr-6 shadow-glow">
                                        {profile.level}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xl font-bold text-personal-text mb-3">{t('profile.level')} {profile.level}</p>
                                        <div className="w-full bg-personal-bg/50 rounded-full h-4 shadow-inner">
                                            <div 
                                                className="bg-gradient-to-r from-personal-accent via-personal-info to-personal-accent h-4 rounded-full shadow-soft transition-all duration-500" 
                                                style={{ width: `${profile.level_progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-personal-text/70 mt-2 font-semibold">
                                            {profile.points} {t('profile.points')} • {profile.points_to_next_level} {t('profile.pointsToNextLevel')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="mr-3">📊</span>
                                    {t('profile.sections.statistics')}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <span className="text-3xl">🎯</span>
                                            <div className="text-3xl font-bold">{profile.completed_challenges}</div>
                                            <div className="text-sm opacity-90 font-medium leading-tight">{t('profile.stats.completedChallenges')}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <span className="text-3xl">🧠</span>
                                            <div className="text-3xl font-bold">{profile.completed_quizzes}</div>
                                            <div className="text-sm opacity-90 font-medium leading-tight">{t('profile.stats.completedQuizzes')}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <span className="text-3xl">🏆</span>
                                            <div className="text-3xl font-bold">{profile.badges_count}</div>
                                            <div className="text-sm opacity-90 font-medium leading-tight">{t('profile.stats.badgesEarned')}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <span className="text-3xl">🔥</span>
                                            <div className="text-3xl font-bold">{profile.active_days}</div>
                                            <div className="text-sm opacity-90 font-medium leading-tight">{t('profile.stats.activeDays')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Insignias Recientes */}
                            <div className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-8 border border-personal-border/30">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="bg-gradient-to-br from-personal-warning via-personal-accent to-personal-warning p-3 rounded-full mr-4 shadow-soft">
                                            <span className="text-white text-xl">🏆</span>
                                        </div>
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-personal-text via-personal-warning to-personal-text bg-clip-text text-transparent">{t('profile.sections.recentBadges')}</h3>
                                    </div>
                                    <button 
                                        onClick={() => router.push(`/${locale}/badges`)}
                                        className="bg-gradient-to-r from-personal-accent via-personal-info to-personal-accent hover:from-personal-accent/90 hover:to-personal-accent/90 text-white px-4 py-2 rounded-xl font-semibold shadow-soft hover:shadow-glow transition-all duration-300 transform hover:scale-105"
                                    >
                                        {t('profile.buttons.viewAll')} 
                                    </button>
                                </div>
                                {profile.recent_badges && profile.recent_badges.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-6">
                                        {profile.recent_badges.map((badge, index) => (
                                           
                                            <div key={index} className="flex flex-col items-center p-6 bg-gradient-to-br from-personal-accent/20 via-personal-warning/20 to-personal-accent/20 backdrop-blur-sm rounded-xl border border-personal-accent/30 hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                                                <div className="text-4xl mb-3 filter drop-shadow-lg">
                                                    <span className="text-3xl">
                                                   
                                                        {predefinedIcons.find(icon => icon.value === badge.icon)?.icon || badge.icon }
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-personal-text text-center">{badge.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-personal-text/70 py-8 text-lg font-medium">{t('profile.noBadges')}</p>
                                )}
                            </div>
                            
                            {/* Points History */}
                            <div className="bg-personal-card rounded-xl shadow-soft p-6 border border-personal-border mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-personal-text mb-4">{t('profile.sections.pointsHistory')}</h3>
                                </div>
                                <PointsHistory onDataUpdate={refreshProfile} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}