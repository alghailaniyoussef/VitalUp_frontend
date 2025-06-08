'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';

interface AdminNavigationProps {
  className?: string;
}

export default function AdminNavigation({ className = '' }: AdminNavigationProps) {
  const pathname = usePathname();

  const { t, locale } = useI18n();

  const navItems = [
    {
      href: `/${locale}/admin`,
      label: t('navigation.dashboard'),
      icon: '📊',
      description: t('navigation.dashboard')
    },
    {
      href: `/${locale}/admin/users`,
      label: t('navigation.users'),
      icon: '👥',
      description: t('admin.navigation.manageUsers')
    },
    {
      href: `/${locale}/admin/badges`,
      label: t('navigation.badges'),
      icon: '🏆',
      description: t('admin.navigation.manageBadges')
    },
    {
      href: `/${locale}/admin/challenges`,
      label: t('navigation.challenges'),
      icon: '💪',
      description: t('admin.navigation.manageChallenges')
    },
    {
      href: `/${locale}/admin/quizzes`,
      label: t('navigation.quizzes'),
      icon: '🧠',
      description: t('admin.navigation.manageQuizzes')
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={`bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-4 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative px-4 py-3 rounded-xl transition-all duration-200 min-w-[140px]
                    ${active 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="font-semibold text-sm">{item.label}</span>
                    <span className={`text-xs mt-1 ${
                      active ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                  
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}