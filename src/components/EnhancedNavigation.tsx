'use client';
import Cookies from 'js-cookie';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from './ProgressTracker';
import { LanguageToggleCompact } from './LanguageToggle';


export default function EnhancedNavigation() {
  const { user, isLoading, setUser, refreshUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      const csrfToken = Cookies.get('XSRF-TOKEN');
            
      // First, get a CSRF cookie if we don't have one
      if (!csrfToken) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
              credentials: 'include'
          });
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '', 
        }
      });
      localStorage.removeItem('auth_user');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout request fails
      localStorage.removeItem('auth_user');
      setUser(null);
      router.push('/');
    }
  };

  // Move function declaration before useEffect
  const getProgressToNextLevel = useCallback(async () => {
    if (!user) return 0;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard-data`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!data || typeof data.level !== 'number' || typeof data.points !== 'number') {
        return 0;
      }

  
      return data;
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  }, [user, locale]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);
  
  // Fetch progress data when user is available
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || isLoading) {
        setLoading(false);
        setPercentage(0);
        return;
      }
  
      try {
        setLoading(true);
        setError(null);
        const data = await getProgressToNextLevel();
        const currentLevelPoints = (data.level - 1) * 100;
        const nextLevelPoints = data.level * 100;
        const progress = ((data.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
        const percentaje =Math.min(Math.max(progress, 0), 100);
        setPercentage(percentaje);
        setLevel(data.level);
        setPoints(data.points);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
        console.error('Error fetching progress:', err);
        setPercentage(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, isLoading, getProgressToNextLevel]);

  // Listen for storage changes to refresh user data when updated in other tabs
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'auth_user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
          // Also refresh from server to ensure data is current
          await refreshUser();
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setUser, refreshUser]);

  // Listen for custom events that indicate user data should be refreshed
  useEffect(() => {
    const handleUserDataUpdate = async () => {
      await refreshUser();
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUserDataUpdate);
  }, [refreshUser]);


  
  const navigationItems = [
    { href: `/${locale}/dashboard`, label: t('navigation.dashboard') },
    { href: `/${locale}/quiz`, label: t('navigation.quizzes') },
    { href: `/${locale}/challenges`, label: t('navigation.challenges') },
    { href: `/${locale}/badges`, label: t('navigation.badges') },
    { href: `/${locale}/settings`, label: t('navigation.settings') }
  ];



  const isAdminActive = pathname.startsWith('/admin');

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center space-x-3">
              <div className="w-30 h-14 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt={t('alt.logo')} width={120} height={56} className="h-auto w-auto" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500 -mt-1">{t('common.tagline')}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user && navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${isActive(item.href)
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
            

            {user?.is_admin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${isAdminActive
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <span>{t('navigation.admin')}</span>
              </Link>
            )}
          </div>

          {/* User menu and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageToggleCompact className="hidden sm:flex" />
            {isLoading ? (
              <div className="animate-pulse flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <>
                {/* User info - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{t('common.level')} {level}</span>
                      <span className="text-xs text-teal-600 font-medium">{points} {t('common.points')}</span>
                    </div>
                  </div>

                  {/* Level progress */}
                  <div className="relative">
                    {loading ? (
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    ) : error ? (
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs text-red-600">!</span>
                      </div>
                    ) : (
                      <CircularProgress
                        percentage={percentage} 
                        size={40}
                        strokeWidth={3}
                        color="#0d9488"
                        showPercentage={false}
                      >
                        <span className="text-xs font-bold text-teal-600">{level}</span>
                      </CircularProgress>
                    )}
                  </div>

                  {/* User menu dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                        >
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            👤 {t('navigation.profile')}
                          </Link>
                          <Link
                            href={`/${locale}/settings`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            ⚙️ {t('navigation.settings')}
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            🚪 {t('auth.logout')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/') ? 'border-teal-500 text-teal-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                >
                  {t('navigation.home')}
                </Link>
                <Link
                  href={`/${locale}/auth/signin`}
                  className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-teal-600 bg-white hover:bg-gray-50 border-teal-600"
                >
                  {t('auth.signin')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-3 space-y-1">
              {/* User info - Mobile */}
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{t('common.level')} {level}</span>
                    <span className="text-sm text-teal-600 font-medium">{points} {t('common.points')}</span>
                  </div>
                </div>
                {loading ? (
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                ) : error ? (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-red-600">{t('common.error')}</span>
                  </div>
                ) : (
                  <CircularProgress
                    percentage={percentage} 
                    size={32}
                    strokeWidth={2}
                    showPercentage={false}
                  >
                    <span className="text-xs font-bold text-teal-600">{level}</span>
                  </CircularProgress>
                )}
              </div>

              {/* Navigation items */}
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive(item.href)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}

              {user.is_admin && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive('/admin')
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span>{t('navigation.admin')}</span>
                </Link>
              )}

              <hr className="my-2" />

              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}