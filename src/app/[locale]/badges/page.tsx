'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import  { CircularProgress } from '@/components/ProgressTracker';
import AchievementNotification, { useAchievementNotifications } from '@/components/AchievementNotification';
import { useRouter } from 'next/navigation';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon_path: string;
  type: string;
  type_translated?: string;
  requirements: unknown;
  points_reward: number;
  earned_at?: string;
  progress?: number;
}

  
export default function BadgesPage() {
  const { user } = useUser();
  const { t, locale } = useI18n();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { currentAchievement, closeAchievement } = useAchievementNotifications();
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

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push(`/${locale}/auth/signin`);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges?locale=${locale}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': locale,
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setBadges(data.available_badges || []);
          setEarnedBadges(data.earned_badges || []);
        } else {
          throw new Error('Failed to fetch badges');
        }
      } catch (error) {
        setError(t('badges.error.fetch'));
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBadges();
    } else {
      setLoading(false);
    }
  }, [user, locale, t]); // Added locale and t as dependencies to refresh when language changes

  if (loading) {
    return <p className="text-center text-green-700 mt-20 text-xl">{t('badges.loading')}</p>;
  }

  if (!user) {
    return <div className="p-4">{t('badges.loginRequired')}</div>;
  }


  // Filter badges by category
  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(badge => badge.type === selectedCategory);

  const filteredEarnedBadges = selectedCategory === 'all'
    ? earnedBadges
    : earnedBadges.filter(badge => badge.type === selectedCategory);

  const badgeCategories = [
    { value: 'all', label: t('badges.categories.all'), icon: '🏆' },
    { value: 'quiz', label: t('badges.categories.quiz'), icon: '🧠' },
    { value: 'challenge', label: t('badges.categories.challenge'), icon: '🎯' },
    { value: 'points', label: t('badges.categories.points'), icon: '💎' },
    { value: 'level', label: t('badges.categories.level'), icon: '⭐' }
  ];

  return (
    <>
      <AchievementNotification
        achievement={currentAchievement}
        onClose={closeAchievement}
      />

      <div className="min-h-screen bg-gradient-to-br from-gamified-bg via-primary-50 to-gamified-bg py-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-gamified-accent via-gamified-warning to-gamified-accent w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-glow animate-pulse">
                <span className="text-white text-2xl">🏆</span>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gamified-text via-gamified-accent to-gamified-text bg-clip-text text-transparent">{t('badges.title')}</h1>
            </div>
            <p className="text-xl text-gamified-text/80 bg-gamified-card/50 backdrop-blur-sm px-8 py-4 rounded-2xl border border-gamified-border/30 max-w-2xl mx-auto">{t('badges.subtitle')}</p>
          </div>

        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center items-center space-x-12 mb-12">
            <div className="text-center bg-gamified-card/50 backdrop-blur-sm px-8 py-6 rounded-2xl border border-gamified-border/30 shadow-soft">
              <div className="text-4xl font-bold text-gamified-success mb-2">{earnedBadges.length}</div>
              <div className="text-sm text-gamified-text/70 font-semibold">{t('badges.stats.earned')}</div>
            </div>
            <div className="text-center bg-gamified-card/50 backdrop-blur-sm px-8 py-6 rounded-2xl border border-gamified-border/30 shadow-soft">
              <div className="text-4xl font-bold text-gamified-accent mb-2">{badges.length}</div>
              <div className="text-sm text-gamified-text/70 font-semibold">{t('badges.stats.available')}</div>
            </div>
            <div className="text-center bg-gamified-card/50 backdrop-blur-sm px-8 py-6 rounded-2xl border border-gamified-border/30 shadow-soft">
              <CircularProgress
                percentage={earnedBadges.length > 0 ? (earnedBadges.length / (earnedBadges.length + badges.length)) * 100 : 0}
                size={80}
                strokeWidth={6}
                showPercentage={false}
              >
                <span className="text-sm font-bold text-gamified-accent">
                  {Math.round(earnedBadges.length > 0 ? (earnedBadges.length / (earnedBadges.length + badges.length)) * 100 : 0)}%
                </span>
              </CircularProgress>
              <div className="text-xs text-gamified-text/60 font-medium mt-2">{t('common.progress')}</div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <p className="text-red-600 flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </motion.div>
        )}

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {badgeCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${selectedCategory === category.value
                  ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-white to-teal-50 text-gray-600 hover:from-teal-50 hover:to-green-50 hover:text-teal-600 border border-teal-200'
                }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Earned Badges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex items-center space-x-4 m-10">
            <div className="bg-gradient-to-br from-gamified-success via-gamified-accent to-gamified-success w-12 h-12 rounded-full flex items-center justify-center shadow-glow">
              <span className="text-white text-xl">✨</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gamified-text via-gamified-success to-gamified-text bg-clip-text text-transparent">{t('badges.sections.earned')}</h2>
            <span className="bg-gradient-to-r from-gamified-success/20 to-gamified-accent/20 text-gamified-success text-sm font-bold px-4 py-2 rounded-full border border-gamified-success/30">
              {filteredEarnedBadges.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredEarnedBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-white via-teal-50 to-green-50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-teal-300 hover:border-teal-400 transition-all duration-300 flex flex-col items-center relative overflow-hidden hover:shadow-2xl"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />

                  <div className="flex items-center w-16 h-16 justify-center mb-4 text-4xl relative z-10">
                    {predefinedIcons.find(icon => icon.value === badge.icon_path)?.icon || badge.icon_path}
                 
                    </div>

                  <h3 className="text-lg font-semibold text-teal-700 text-center mb-2 relative z-10">{badge.name}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4 relative z-10">{badge.description}</p>

                  {badge.points_reward && (
                    <div className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full mb-2">
                      +{badge.points_reward} {t('badges.points')}
                    </div>
                  )}

                  {badge.earned_at && (
                    <div className="mt-auto pt-2 text-xs text-teal-600 border-t border-teal-100 w-full text-center relative z-10">
                      {t('badges.earnedOn')} {new Date(badge.earned_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredEarnedBadges.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 text-lg">
                {selectedCategory === 'all'
                  ? t('badges.empty.allEarned')
                  : t('badges.empty.categoryEarned', { category: badgeCategories.find(c => c.value === selectedCategory)?.label.toLowerCase() || '' })
                }
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Available Badges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <div className="flex items-center space-x-4 m-10">
            <div className="bg-gradient-to-br from-gamified-accent via-gamified-warning to-gamified-accent w-12 h-12 rounded-full flex items-center justify-center shadow-glow">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gamified-text via-gamified-accent to-gamified-text bg-clip-text text-transparent">{t('badges.sections.available')}</h2>
            <span className="bg-gradient-to-r from-gamified-accent/20 to-gamified-warning/20 text-gamified-accent text-sm font-bold px-4 py-2 rounded-full border border-gamified-accent/30">
              {filteredBadges.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`available-${selectedCategory}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-white/80 to-gray-50/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-300 hover:border-teal-300 transition-all duration-300 flex flex-col items-center opacity-75 hover:opacity-95 relative overflow-hidden hover:shadow-xl"
                >
                  {/* Progress indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                    <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: '0%' }} />
                  </div>

                  <div className="flex items-center w-16 h-16 justify-center mb-4 text-4xl grayscale hover:grayscale-0 transition-all duration-300">
                    {predefinedIcons.find(icon => icon.value === badge.icon_path)?.icon || badge.icon_path}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-600 text-center mb-2 group-hover:text-teal-700 transition-colors">{badge.name}</h3>
                  <p className="text-gray-500 text-center text-sm mb-4">{badge.description}</p>

                  {badge.points_reward && (
                    <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full mb-2">
                      +{badge.points_reward} {t('badges.points')}
                    </div>
                  )}

                  <div className="mt-auto pt-2 text-xs text-gray-500 border-t border-gray-200 w-full text-center">
                    {t('badges.completeToEarn')}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredBadges.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-600 text-lg">
                {selectedCategory === 'all'
                  ? t('badges.empty.allAvailable')
                  : t('badges.empty.categoryAvailable', { category: badgeCategories.find(c => c.value === selectedCategory)?.label.toLowerCase() || '' })
                }
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Badge Categories Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm m-10 rounded-xl shadow-lg p-6 border border-teal-200"
        >
          <h2 className="text-xl  font-bold text-teal-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            {t('badges.sections.categories')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: t('badges.categoryTypes.wellness.title'),
                description: t('badges.categoryTypes.wellness.description'),
                icon: "🌿"
              },
              {
                title: t('badges.categoryTypes.fitness.title'),
                description: t('badges.categoryTypes.fitness.description'),
                icon: "🏃‍♂️"
              },
              {
                title: t('badges.categoryTypes.knowledge.title'),
                description: t('badges.categoryTypes.knowledge.description'),
                icon: "🧠"
              }
            ].map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg shadow-sm border border-teal-100"
              >
                <h3 className="font-medium text-teal-800 mb-2 flex items-center">
                  <span className="mr-2 text-xl">{category.icon}</span>
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Badge Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-200"
        >
          <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center">
            <span className="mr-2">✨</span>
            {t('badges.sections.benefits')}
          </h2>
          <ul className="space-y-3 text-gray-700">
            {[
              { text: t('badges.benefits.unlock'), icon: "🔓" },
              { text: t('badges.benefits.track'), icon: "📈" },
              { text: t('badges.benefits.earn'), icon: "🎁" },
              { text: t('badges.benefits.share'), icon: "🔗" },
              { text: t('badges.benefits.recommendations'), icon: "🎯" }
            ].map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (index * 0.1) }}
                className="flex items-start space-x-2 p-2 hover:bg-teal-50 rounded-md transition-colors duration-200"
              >
                <span className="text-xl">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>
        </div>   
         </div>
      </> );
}