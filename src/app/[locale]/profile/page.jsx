'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import PointsHistory from '@/components/PointsHistory';

export default function ProfilePage() {
    const { user, isLoading } = useUser();
    const { t, locale } = useI18n();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

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
            router.push('/auth/signin');
            return;
        }

        if (user) {
            fetchProfile();
        }
    }, [user, isLoading, router]);

    if (isLoading || loading) {
        return <p className="text-center text-teal-700 mt-20 text-xl">{t('profile.loading')}</p>;
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <section className="min-h-screen bg-teal-50 px-6 py-10 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white shadow-lg rounded-xl p-6 border border-teal-200">
                    <h1 className="text-3xl font-bold text-teal-800">{t('profile.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('profile.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {profile && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Información Personal */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h2 className="text-xl font-semibold text-teal-800">{user.name}</h2>
                                    <p className="text-gray-600">{user.email}</p>
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-500">{t('profile.memberSince')}</p>
                                        <p className="font-medium text-teal-700">
                                            {new Date(profile.created_at).toLocaleDateString(locale)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-teal-100">
                                    <button
                                        onClick={() => router.push('/settings')}
                                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition"
                                    >
                                        {t('profile.buttons.editPreferences')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas y Progreso */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Nivel y Puntos */}
                            <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                                <h3 className="text-lg font-semibold text-teal-800 mb-4">{t('profile.sections.levelProgress')}</h3>
                                <div className="flex items-center mb-4">
                                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 text-2xl font-bold mr-4">
                                        {profile.level}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700">{t('profile.level')} {profile.level}</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div 
                                                className="bg-teal-600 h-2.5 rounded-full" 
                                                style={{ width: `${profile.level_progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {profile.points} {t('profile.points')} • {profile.points_to_next_level} {t('profile.pointsToNextLevel')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas */}
                            <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                                <h3 className="text-lg font-semibold text-teal-800 mb-4">{t('profile.sections.statistics')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-teal-50 rounded-lg">
                                        <p className="text-sm text-gray-600">{t('profile.stats.completedChallenges')}</p>
                                        <p className="text-2xl font-bold text-teal-700">{profile.completed_challenges}</p>
                                    </div>
                                    <div className="p-4 bg-teal-50 rounded-lg">
                                        <p className="text-sm text-gray-600">{t('profile.stats.completedQuizzes')}</p>
                                        <p className="text-2xl font-bold text-teal-700">{profile.completed_quizzes}</p>
                                    </div>
                                    <div className="p-4 bg-teal-50 rounded-lg">
                                        <p className="text-sm text-gray-600">{t('profile.stats.badgesEarned')}</p>
                                        <p className="text-2xl font-bold text-teal-700">{profile.badges_count}</p>
                                    </div>
                                    <div className="p-4 bg-teal-50 rounded-lg">
                                        <p className="text-sm text-gray-600">{t('profile.stats.activeDays')}</p>
                                        <p className="text-2xl font-bold text-teal-700">{profile.active_days}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Insignias Recientes */}
                            <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-teal-800">{t('profile.sections.recentBadges')}</h3>
                                    <button 
                                        onClick={() => router.push('/badges')}
                                        className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                                    >
                                        {t('profile.buttons.viewAll')} →
                                    </button>
                                </div>
                                {profile.recent_badges && profile.recent_badges.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {profile.recent_badges.map((badge, index) => (
                                            <div key={index} className="flex flex-col items-center p-3 bg-teal-50 rounded-lg">
                                                <div className="text-3xl mb-2">{badge.icon}</div>
                                                <span className="text-sm font-medium text-teal-900 text-center">{badge.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-600 py-4">{t('profile.noBadges')}</p>
                                )}
                            </div>
                            
                            {/* Points History */}
                            <div className="bg-white rounded-xl shadow p-6 border border-teal-200 mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-teal-800 mb-4">{t('profile.sections.pointsHistory')}</h3>
                                </div>
                                <PointsHistory onDataUpdate={refreshProfile} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}