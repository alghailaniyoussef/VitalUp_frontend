'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import Link from 'next/link';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export default function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const { t, locale } = useI18n();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0    bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Welcome content */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-3xl">🎉</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                {t('welcome.modal.title', { name: userName })}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6"
              >
                {t('welcome.modal.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 text-left bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-xl mb-6"
              >
                <h3 className="font-semibold text-gray-900 mb-3">{t('welcome.modal.gettingStarted')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-600">📊</span>
                    <span className="text-sm text-gray-700">{t('welcome.modal.step1')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-600">🧠</span>
                    <span className="text-sm text-gray-700">{t('welcome.modal.step2')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-600">💪</span>
                    <span className="text-sm text-gray-700">{t('welcome.modal.step3')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-teal-600">🏆</span>
                    <span className="text-sm text-gray-700">{t('welcome.modal.step4')}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href={`/${locale}/about`}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-200 text-center"
                  onClick={onClose}
                >
                  {t('welcome.modal.learnMore')}
                </Link>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  {t('welcome.modal.getStarted')}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}