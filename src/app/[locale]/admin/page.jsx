'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { motion } from 'framer-motion';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminDashboard() {
    const { user, isLoading } = useUser();
    const { t ,locale} = useI18n();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push(`/${locale}/auth/signin`);
                setLoading(false);
                return;
            }
            
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics`;
            console.log('Fetching analytics with URL:', apiUrl);
            
            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': locale,
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            console.log('Analytics API response status:', res.status);

            if (!res.ok) {
                console.error('Failed to fetch analytics data, status:', res.status);
                try {
                    const errorData = await res.json();
                    console.error('Error details:', errorData);
                } catch (jsonError) {
                    console.error('Could not parse error response');
                }
                
                // Provide fallback data
                setAnalytics({
                    totalUsers: 0,
                    activeUsers: 0,
                    totalChallenges: 0,
                    totalQuizzes: 0,
                    usersByLevel: [],
                    topChallenges: []
                });
                return;
            }
            
            try {
                const data = await res.json();
                console.log('Analytics data received:', data);
                
                if (data && typeof data === 'object') {
                    setAnalytics(data);
                } else {
                    console.error('Unexpected analytics data format:', data);
                    setAnalytics({
                        totalUsers: 0,
                        activeUsers: 0,
                        totalChallenges: 0,
                        totalQuizzes: 0,
                        usersByLevel: [],
                        topChallenges: []
                    });
                }
            } catch (jsonError) {
                console.error('Error parsing analytics data:', jsonError);
                setAnalytics({
                    totalUsers: 0,
                    activeUsers: 0,
                    totalChallenges: 0,
                    totalQuizzes: 0,
                    usersByLevel: [],
                    topChallenges: []
                });
            }
        } catch (err) {
            console.error('❌ Error loading admin dashboard:', err);
            setAnalytics({
                totalUsers: 0,
                activeUsers: 0,
                totalChallenges: 0,
                totalQuizzes: 0,
                usersByLevel: [],
                topChallenges: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Redirect if user is not admin
        if (!isLoading && user && !user.is_admin) {
            router.push('/dashboard');
            return;
        }

        if (!isLoading && !user) {
            router.push('/auth/signin');
            return;
        }

        if (user && user.is_admin) {
            fetchAnalytics();
        }
    }, [user, isLoading, router, locale]);

    if (isLoading || loading) {
        return <p className="text-center text-admin-accent mt-20 text-xl">{t('admin.loading')}</p>;
    }

    if (!user || !user.is_admin) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-admin-bg via-gray-900 to-admin-bg">
            {/* Header */}
            <div className="bg-admin-card backdrop-blur-sm border-b border-admin-border sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-gradient-to-br from-admin-accent via-admin-info to-admin-accent w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-glow">
                                <span className="text-white text-2xl">⚡</span>
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-admin-text via-admin-accent to-admin-text bg-clip-text text-transparent">{t('admin.title')}</h1>
                        </div>
                        <p className="text-xl text-admin-text/80 bg-admin-card/30 backdrop-blur-sm px-8 py-4 rounded-2xl border border-admin-border/20">{t('admin.subtitle')}</p>
                    </div>
                </div>
            </div>
            
            <AdminNavigation currentPage="dashboard" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <motion.div 
                        className="bg-gradient-to-br from-admin-card via-gray-800 to-admin-card rounded-2xl shadow-admin p-6 border border-admin-border/30 hover:shadow-glow transition-all duration-300 group backdrop-blur-sm"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-admin-text/60 text-xs font-bold uppercase tracking-wider mb-2">{t('admin.stats.totalUsers')}</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-admin-text to-admin-accent bg-clip-text text-transparent">{analytics?.totalUsers || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-admin-accent to-admin-info p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white text-xl">👥</span>
                            </div>
                        </div>
                        <div className="mt-4 h-1 bg-gradient-to-r from-admin-accent to-admin-info rounded-full"></div>
                    </motion.div>

                    <motion.div 
                        className="bg-gradient-to-br from-admin-card via-gray-800 to-admin-card rounded-2xl shadow-admin p-6 border border-admin-border/30 hover:shadow-glow transition-all duration-300 group backdrop-blur-sm"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-admin-text/60 text-xs font-bold uppercase tracking-wider mb-2">{t('admin.stats.activeUsers')}</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-admin-text to-admin-info bg-clip-text text-transparent">{analytics?.activeUsers || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-admin-info to-green-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white text-xl">🟢</span>
                            </div>
                        </div>
                        <div className="mt-4 h-1 bg-gradient-to-r from-admin-info to-green-500 rounded-full"></div>
                    </motion.div>

                    <motion.div 
                        className="bg-gradient-to-br from-admin-card via-gray-800 to-admin-card rounded-2xl shadow-admin p-6 border border-admin-border/30 hover:shadow-glow transition-all duration-300 group backdrop-blur-sm"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-admin-text/60 text-xs font-bold uppercase tracking-wider mb-2">{t('admin.stats.totalChallenges')}</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-admin-text to-admin-warning bg-clip-text text-transparent">{analytics?.totalChallenges || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-admin-warning to-orange-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white text-xl">🎯</span>
                            </div>
                        </div>
                        <div className="mt-4 h-1 bg-gradient-to-r from-admin-warning to-orange-500 rounded-full"></div>
                    </motion.div>

                    <motion.div 
                        className="bg-gradient-to-br from-admin-card via-gray-800 to-admin-card rounded-2xl shadow-admin p-6 border border-admin-border/30 hover:shadow-glow transition-all duration-300 group backdrop-blur-sm"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-admin-text/60 text-xs font-bold uppercase tracking-wider mb-2">{t('admin.stats.totalQuizzes')}</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-admin-text to-admin-success bg-clip-text text-transparent">{analytics?.totalQuizzes || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-admin-success to-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white text-xl">📝</span>
                            </div>
                        </div>
                        <div className="mt-4 h-1 bg-gradient-to-r from-admin-success to-emerald-500 rounded-full"></div>
                    </motion.div>
                </div>

                {/* Admin Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group"
                    >
                        <Link href={`/${locale}/admin/users`} className="block bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-all duration-300 hover:border-admin-accent/50">
                            <div className="flex items-center mb-3">
                                <div className="bg-admin-accent/20 p-2 rounded-lg group-hover:bg-admin-accent/30 transition-colors">
                                    <svg className="w-6 h-6 text-admin-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-admin-text group-hover:text-admin-accent transition-colors">{t('admin.navigation.manageUsers')}</h3>
                            <p className="text-admin-text/70 mt-1">{t('admin.navigation.manageUsersDesc')}</p>
                        </Link>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group"
                    >
                        <Link href={`/${locale}/admin/challenges`} className="block bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-all duration-300 hover:border-admin-warning/50">
                            <div className="flex items-center mb-3">
                                <div className="bg-admin-warning/20 p-2 rounded-lg group-hover:bg-admin-warning/30 transition-colors">
                                    <svg className="w-6 h-6 text-admin-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-admin-text group-hover:text-admin-warning transition-colors">{t('admin.navigation.manageChallenges')}</h3>
                            <p className="text-admin-text/70 mt-1">{t('admin.navigation.manageChallengesDesc')}</p>
                        </Link>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group"
                    >
                        <Link href={`/${locale}/admin/badges`} className="block bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-all duration-300 hover:border-admin-success/50">
                            <div className="flex items-center mb-3">
                                <div className="bg-admin-success/20 p-2 rounded-lg group-hover:bg-admin-success/30 transition-colors">
                                    <svg className="w-6 h-6 text-admin-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-admin-text group-hover:text-admin-success transition-colors">{t('admin.navigation.manageBadges')}</h3>
                            <p className="text-admin-text/70 mt-1">{t('admin.navigation.manageBadgesDesc')}</p>
                        </Link>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group"
                    >
                        <Link href={`/${locale}/admin/quizzes`} className="block bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-all duration-300 hover:border-admin-info/50">
                            <div className="flex items-center mb-3">
                                <div className="bg-admin-info/20 p-2 rounded-lg group-hover:bg-admin-info/30 transition-colors">
                                    <svg className="w-6 h-6 text-admin-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-admin-text group-hover:text-admin-info transition-colors">{t('admin.navigation.manageQuizzes')}</h3>
                            <p className="text-admin-text/70 mt-1">{t('admin.navigation.manageQuizzesDesc')}</p>
                        </Link>
                    </motion.div>
                </div>

                {/* Data Visualization */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.9 }}
                            className="bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-shadow"
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-admin-accent/20 p-2 rounded-lg mr-3">
                                    <svg className="w-6 h-6 text-admin-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-admin-text">{t('admin.charts.usersByLevel')}</h3>
                            </div>
                            <div className="space-y-3">
                                {analytics.usersByLevel.map((levelData, index) => (
                                    <motion.div 
                                        key={index} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                                        className="flex items-center"
                                    >
                                        <span className="w-20 text-sm font-medium text-admin-text bg-admin-accent/10 px-2 py-1 rounded">{t('admin.charts.level')} {levelData.level}</span>
                                        <div className="flex-1 mx-3 bg-admin-border rounded-full h-3 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(levelData.count / analytics.totalUsers) * 100}%` }}
                                                transition={{ duration: 1, delay: 1.2 + index * 0.1, ease: "easeOut" }}
                                                className="bg-gradient-to-r from-admin-accent to-admin-info h-full rounded-full relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                            </motion.div>
                                        </div>
                                        <span className="text-sm font-bold text-admin-text bg-admin-accent/10 px-2 py-1 rounded min-w-[3rem] text-center">{levelData.count}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="bg-admin-card p-6 rounded-xl shadow-soft border border-admin-border hover:shadow-glow transition-shadow"
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-admin-success/20 p-2 rounded-lg mr-3">
                                    <svg className="w-6 h-6 text-admin-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-admin-text">{t('admin.charts.topChallenges')}</h3>
                            </div>
                            <div className="space-y-3">
                                {analytics.topChallenges.map((challenge, index) => (
                                    <motion.div 
                                        key={index} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="flex justify-between items-center p-4 bg-admin-accent/5 rounded-lg border border-admin-border hover:border-admin-success/50 transition-all"
                                    >
                                        <div className="flex items-center">
                                            <div className="bg-admin-success text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-admin-text">{challenge.title || `${t('admin.charts.challenge')} #${challenge.id}`}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-admin-success font-bold mr-2">{challenge.completions}</span>
                                            <span className="text-xs text-admin-text/60">{t('admin.charts.completions')}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}