'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t, locale } = useI18n();

    useEffect(() => {
        const fetchUserAndDashboard = async () => {
            try {
                const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                    credentials: 'include',
                });
                if (!userRes.ok) throw new Error('Not authenticated');
                const userData = await userRes.json();
                setUser(userData);

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard-data`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept-Language': locale
                    },
                    credentials: 'include',
                });

                if (!res.ok) throw new Error('Fallo al obtener los datos');
                const data = await res.json();
                setDashboard(data);
            } catch (err) {
                console.error('❌ Error cargando dashboard:', err);
                router.push(`/${locale}/auth/signin`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndDashboard();
    }, [locale, router]);

    if (loading) {
        return <p className="text-center text-green-700 mt-20 text-xl">{t('dashboard.loading')}</p>;
    }

    return (
        <section className="min-h-screen bg-teal-50 px-6 py-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col md:flex-row justify-between items-center border border-teal-200">
                    <div>
                        <h1 className="text-3xl font-bold text-teal-800">{t('dashboard.welcome', { name: user?.name })}</h1>
                        <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
                    </div>
                    <button 
                        onClick={() => router.push(`/${locale}/profile`)} 
                        className="mt-4 md:mt-0 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {t('dashboard.editProfile')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl text-center shadow border border-teal-200">
                        <h3 className="text-lg font-semibold text-teal-700">{t('dashboard.totalPoints')}</h3>
                        <p className="text-4xl font-bold text-teal-900 mt-2">{dashboard?.points ?? 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl text-center shadow border border-teal-200">
                        <h3 className="text-lg font-semibold text-teal-700">{t('dashboard.level')}</h3>
                        <p className="text-4xl font-bold text-teal-900 mt-2">{dashboard?.level ?? 1} 🏆</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl text-center shadow border border-teal-200">
                        <h3 className="text-lg font-semibold text-teal-700">{t('dashboard.badges')}</h3>
                        <p className="text-4xl font-bold text-teal-900 mt-2">{dashboard?.badges_count ?? 0} 🎖️</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl text-center shadow border border-teal-200">
                        <h3 className="text-lg font-semibold text-teal-700">{t('dashboard.challenges')}</h3>
                        <p className="text-4xl font-bold text-teal-900 mt-2">{dashboard?.completed_challenges ?? 0} ✨</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Quizzes */}
                    <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-teal-800">{t('dashboard.recentQuizzes')}</h2>
                            <Link href={`/${locale}/quiz`} className="text-teal-600 hover:text-teal-700 text-sm font-medium">{t('dashboard.viewAll')}</Link>
                        </div>
                        <div className="space-y-3">
                            {(dashboard?.recent_quizzes ?? []).map((quiz, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                                    <span className="font-medium text-teal-900">{quiz.title}</span>
                                    <span className="text-teal-700">{quiz.score}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Challenges */}
                    <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-teal-800">{t('dashboard.activeChallenges')}</h2>
                            <Link href={`/${locale}/challenges`} className="text-teal-600 hover:text-teal-700 text-sm font-medium">{t('dashboard.viewAll')}</Link>
                        </div>
                        <div className="space-y-3">
                            {(dashboard?.active_challenges ?? []).map((challenge, i) => (
                                <div key={i} className="p-3 bg-teal-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-teal-900">{challenge.title}</span>
                                        <span className="text-sm text-teal-700">{challenge.progress}%</span>
                                    </div>
                                    <div className="w-full bg-teal-200 rounded-full h-2">
                                        <div 
                                            className="bg-teal-600 h-2 rounded-full" 
                                            style={{ width: `${challenge.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Badges Showcase */}
                <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-teal-800">{t('dashboard.recentBadges')}</h2>
                        <Link href={`/${locale}/badges`} className="text-teal-600 hover:text-teal-700 text-sm font-medium">{t('dashboard.viewAll')}</Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {(dashboard?.recent_badges ?? []).map((badge, i) => (
                            <div key={i} className="flex flex-col items-center p-4 bg-teal-50 rounded-lg">
                                <div className="text-3xl mb-2">{badge.icon}</div>
                                <span className="text-sm font-medium text-teal-900 text-center">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Tip */}
                <div className="bg-white rounded-xl shadow p-6 border border-teal-200">
                    <h2 className="text-xl font-bold text-teal-800 mb-4">{t('dashboard.dailyTip')}</h2>
                    <p className="text-gray-700 leading-relaxed">
                        {dashboard?.tip ?? t('dashboard.defaultTip')}
                    </p>
                </div>
            </div>
        </section>
    );
}
