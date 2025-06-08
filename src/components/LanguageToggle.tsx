'use client';

import React from 'react';
import { useI18n } from '@/context/I18nContext';
import { motion } from 'framer-motion';

interface LanguageToggleProps {
  className?: string;
  showLabels?: boolean;
}

export default function LanguageToggle({ className = '', showLabels = true }: LanguageToggleProps) {
  const { locale, setLocale, availableLocales } = useI18n();

  const { t } = useI18n();
  
  const languages = {
    en: t('languages.english'),
    es: t('languages.spanish')
  };

  const languageFlags = {
    en: '🇺🇸',
    es: '🇪🇸'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {availableLocales.map((lang) => (
        <motion.button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`
            flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200
            ${
              locale === lang
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg">{languageFlags[lang]}</span>
          {showLabels && (
            <span className="text-sm font-medium">
              {languages[lang]}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Compact version for mobile/small spaces
export function LanguageToggleCompact({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'es' : 'en');
  };

  const languageFlags = {
    en: '🇺🇸',
    es: '🇪🇸'
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className={`
        flex items-center justify-center w-10 h-10 rounded-full
        bg-gray-100 hover:bg-gray-200 transition-colors duration-200
        ${className}
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={`Switch to ${locale === 'en' ? 'Español' : 'English'}`}
    >
      <span className="text-lg">{languageFlags[locale]}</span>
    </motion.button>
  );
}