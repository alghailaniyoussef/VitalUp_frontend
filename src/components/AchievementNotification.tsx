'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  type: 'badge' | 'level' | 'challenge' | 'quiz' | 'points';
  title: string;
  description: string;
  icon?: string;
  points?: number;
  level?: number;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
  duration?: number;
}

const typeConfig = {
  badge: {
    icon: '🏆',
    color: 'from-yellow-400 to-orange-500',
    textColor: 'text-yellow-900',
    bgColor: 'bg-yellow-50'
  },
  level: {
    icon: '⭐',
    color: 'from-purple-400 to-pink-500',
    textColor: 'text-purple-900',
    bgColor: 'bg-purple-50'
  },
  challenge: {
    icon: '🎯',
    color: 'from-green-400 to-teal-500',
    textColor: 'text-green-900',
    bgColor: 'bg-green-50'
  },
  quiz: {
    icon: '🧠',
    color: 'from-blue-400 to-indigo-500',
    textColor: 'text-blue-900',
    bgColor: 'bg-blue-50'
  },
  points: {
    icon: '💎',
    color: 'from-teal-400 to-cyan-500',
    textColor: 'text-teal-900',
    bgColor: 'bg-teal-50'
  }
};

export default function AchievementNotification({
  achievement,
  onClose,
  duration = 5000
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [achievement, duration, onClose]);

  if (!achievement) return null;

  const config = typeConfig[achievement.type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={`${config.bgColor} border border-gray-200 rounded-xl shadow-lg overflow-hidden`}>
            {/* Animated background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`} />
            
            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                    {achievement.icon || config.icon}
                  </div>
                </div>
                
                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${config.textColor}`}>
                      Achievement Unlocked!
                    </h3>
                    <button
                      onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-gray-900 font-medium text-sm mt-1">
                    {achievement.title}
                  </p>
                  
                  <p className="text-gray-600 text-xs mt-1">
                    {achievement.description}
                  </p>
                  
                  {/* Additional info */}
                  <div className="flex items-center space-x-4 mt-2">
                    {achievement.points && (
                      <span className="text-xs font-medium text-teal-600">
                        +{achievement.points} points
                      </span>
                    )}
                    {achievement.level && (
                      <span className="text-xs font-medium text-purple-600">
                        Level {achievement.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-1 bg-gradient-to-r ${config.color}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing achievement notifications
export function useAchievementNotifications() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const showAchievement = (achievement: Achievement) => {
    if (currentAchievement) {
      setQueue(prev => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
    }
  };

  const closeAchievement = () => {
    setCurrentAchievement(null);
    
    // Show next achievement in queue
    setTimeout(() => {
      setQueue(prev => {
        if (prev.length > 0) {
          setCurrentAchievement(prev[0]);
          return prev.slice(1);
        }
        return prev;
      });
    }, 500);
  };

  return {
    currentAchievement,
    showAchievement,
    closeAchievement,
    queueLength: queue.length
  };
}