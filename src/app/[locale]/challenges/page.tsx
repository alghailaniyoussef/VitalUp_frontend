'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '@/components/ProgressTracker';

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  category_translated?: string;
  difficulty_translated?: string;
  status_translated?: string;
  goals: string[];
  duration_days: number;
  points_reward: number;
  badge_rewards: string[];
  is_active: boolean;
  start_date: string;
  end_date: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  points_earned?: number;
  duration?: number;
}


export default function ChallengesPage() {
  const { user } = useUser();
  const { t, locale } = useI18n();
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculate progress based on days elapsed
  const calculateProgress = (challenge: Challenge): number => {
    if (!challenge.started_at || challenge.status === 'completed') {
      return challenge.status === 'completed' ? 100 : 0;
    }

    const startDate = new Date(challenge.started_at);
    const currentDate = new Date();
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = challenge.duration_days || 7;
    
    const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
    return Math.round(progress);
  };

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges?filter_by_interests=true&locale=${locale}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': locale,
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
        },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Filter out duplicate challenges by ID
        const uniqueAvailableChallenges = filterUniqueChallenges(data.available_challenges || []);
        const uniqueActiveChallenges = filterUniqueChallenges(data.active_challenges || []);
        const uniqueCompletedChallenges = filterUniqueChallenges(data.completed_challenges || []);
        
        setAvailableChallenges(uniqueAvailableChallenges);
        setActiveChallenges(uniqueActiveChallenges);
        setCompletedChallenges(uniqueCompletedChallenges);
      } else {
        setError(t('challenges.error.fetch'));
      }
    } catch (error) {
      setError(t('challenges.error.fetch'));
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user, locale, fetchChallenges]);

  // Helper function to filter out duplicate challenges by ID
  const filterUniqueChallenges = (challenges: Challenge[]) => {
    const uniqueIds = new Set();
    return challenges.filter(challenge => {
      if (uniqueIds.has(challenge.id)) {
        return false;
      }
      uniqueIds.add(challenge.id);
      return true;
    });
  };

  const joinChallenge = async (challengeId: number) => {
    setIsJoining(true);
    setError(null);
    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': locale,
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        // Show success message with animation
        setSuccessMessage(t('challenges.success.joined'));
        setShowConfetti(true);
        setTimeout(() => {
          setSuccessMessage(null);
          setShowConfetti(false);
        }, 3000);
        
        // Refresh challenges data to get updated lists
        await fetchChallenges();
        
        // Refresh points history if available
        if (typeof window !== 'undefined' && (window as unknown as { refreshPointsHistory?: () => void }).refreshPointsHistory) {
          (window as unknown as { refreshPointsHistory: () => void }).refreshPointsHistory();
        }
      } else {
        setError(responseData.message || t('challenges.error.join'));
      }
    } catch (error) {
      setError(t('challenges.error.join'));
      console.error('Error joining challenge:', error);
    } finally {
      setIsJoining(false);
    }
  };

  // Confetti component for celebrations
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;
          
          return (
            <div 
              key={i}
              className="absolute top-0 rounded-full"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                animation: `fall ${animationDuration}s ease-in ${delay}s forwards`,
              }}
            />
          );
        })}
      </div>
    );
  };

  if (!user) {
    return <div className="p-4">{t('challenges.loginRequired')}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-teal-800 mb-2">{t('challenges.title')}</h1>
            <p className="text-teal-600 text-lg">{t('challenges.subtitle')}</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
            {t('challenges.collection')}
          </h1>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{completedChallenges.length}</div>
              <div className="text-sm text-gray-600">{t('challenges.stats.completed')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{availableChallenges.length}</div>
              <div className="text-sm text-gray-600">{t('challenges.stats.available')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{activeChallenges.length}</div>
              <div className="text-sm text-gray-600">{t('challenges.stats.inProgress')}</div>
            </div>
            <div className="text-center">
              <CircularProgress
                percentage={completedChallenges.length > 0 ? (completedChallenges.length / (completedChallenges.length + availableChallenges.length + activeChallenges.length)) * 100 : 0}
                size={60}
                strokeWidth={4}
                showPercentage={false}
              >
                <span className="text-xs font-bold text-teal-600">
                  {Math.round(completedChallenges.length > 0 ? (completedChallenges.length / (completedChallenges.length + availableChallenges.length + activeChallenges.length)) * 100 : 0)}%
                </span>
              </CircularProgress>
            </div>
          </div>
        </motion.div>
      
      {/* Success message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-rose-100 border-l-4 border-rose-500 text-rose-700 p-4 mb-4 rounded shadow-md"
        >
          {error}
        </motion.div>
      )}

      {activeChallenges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-teal-800 mb-6">{t('challenges.sections.active')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {activeChallenges.map((challenge, index) => (
              <motion.div 
                key={challenge.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100"
              >
                <h3 className="text-xl font-semibold text-teal-700 mb-2">{challenge.title}</h3>
                <p className="text-gray-600 mb-4">{challenge.description}</p>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-teal-700">{t('challenges.progress.label')}</span>
                    <span className="text-sm font-bold text-teal-600">{calculateProgress(challenge)}%</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateProgress(challenge)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.1 }}
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full relative overflow-hidden"
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ 
                          duration: 2, 
                          ease: "easeInOut", 
                          repeat: Infinity, 
                          repeatDelay: 3,
                          delay: index * 0.2 
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-12"
                      />
                    </motion.div>
                    {/* Progress milestones */}
                    {[25, 50, 75].map((milestone) => (
                      <div
                        key={milestone}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                        style={{ left: `${milestone}%` }}
                      />
                    ))}
                  </div>
                  {/* Progress status text */}
                  <div className="mt-2 text-xs text-gray-500">
                    {(() => {
                      const progress = calculateProgress(challenge);
                      if (progress === 100) {
                        return (
                          <span className="text-green-600 font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t('challenges.progress.complete')}
                          </span>
                        );
                      } else if (progress >= 75) {
                        return <span className="text-orange-600 font-medium">{t('challenges.progress.almostThere')}</span>;
                      } else if (progress >= 50) {
                        return <span className="text-blue-600 font-medium">{t('challenges.progress.halfway')}</span>;
                      } else if (progress >= 25) {
                        return <span className="text-purple-600 font-medium">{t('challenges.progress.goodStart')}</span>;
                      } else {
                        return <span className="text-gray-600">{t('challenges.progress.justStarted')}</span>;
                      }
                    })()}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600">{challenge.category_translated || challenge.category}</span>
                  <span className="text-sm text-teal-600">{challenge.duration_days} {t('challenges.days')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {availableChallenges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-teal-800 mb-6">{t('challenges.sections.available')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {availableChallenges.map((challenge, index) => (
              <motion.div 
                key={challenge.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 hover:border-teal-200 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-teal-700 mb-2">{challenge.title}</h3>
                <p className="text-gray-600 mb-4">{challenge.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-teal-600">{challenge.category_translated || challenge.category}</span>
                  <span className="text-sm text-teal-600">{challenge.duration_days} {t('challenges.days')}</span>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    onClick={() => joinChallenge(challenge.id)}
                    disabled={isJoining}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn bg-teal-600 hover:bg-teal-700 text-white border-none ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isJoining ? t('challenges.buttons.joining') : t('challenges.buttons.join')}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {completedChallenges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-teal-800 mb-6">{t('challenges.sections.completed')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {completedChallenges.map((challenge, index) => (
              <motion.div 
                key={challenge.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 relative"
              >
                <div className="absolute top-4 right-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + (index * 0.1), type: "spring" }}
                    className="bg-green-500 text-white rounded-full p-1"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                </div>
                <h3 className="text-xl font-semibold text-teal-700 mb-2">{challenge.title}</h3>
                <p className="text-gray-600 mb-4">{challenge.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-600">{challenge.category_translated || challenge.category}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-500">{t('challenges.completedOn')} {new Date(challenge.completed_at || '').toLocaleDateString(locale)}</span>
                    <span className="text-sm font-medium text-green-600">+{challenge.points_reward || challenge.points_earned} {t('challenges.points')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
}