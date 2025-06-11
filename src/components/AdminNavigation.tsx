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
    if (href === `/${locale}/admin`) {
      return pathname === `/${locale}/admin`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={`bg-gradient-to-r from-admin-surface via-admin-surface-light to-admin-surface backdrop-blur-sm border-b border-admin-border sticky top-16 z-20 shadow-admin ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-2 py-6 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative px-6 py-4 rounded-2xl transition-all duration-300 min-w-[160px] group
                    ${active 
                      ? 'bg-gradient-to-br from-admin-accent via-admin-info to-admin-accent text-white shadow-glow transform scale-105' 
                      : 'bg-admin-card hover:bg-admin-card-hover text-admin-text hover:text-white border border-admin-border/30 hover:border-admin-accent/50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.span 
                      className="text-3xl mb-2 filter drop-shadow-sm"
                      animate={active ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                      active ? 'text-white/90' : 'text-admin-text-muted group-hover:text-admin-accent'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                  
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-br from-admin-accent via-admin-info to-admin-accent rounded-2xl"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                    active ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                  } bg-gradient-to-br from-admin-accent/20 via-transparent to-admin-info/20`} />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}