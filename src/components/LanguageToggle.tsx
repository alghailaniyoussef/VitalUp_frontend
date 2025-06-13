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
    es: t('languages.spanish'),
    ar: t('languages.arabic')
  };

  const languageFlags = {
    en: (
      <svg className="w-5 h-4" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="us">
            <path d="M0 0h640v480H0z"/>
          </clipPath>
        </defs>
        <g clipPath="url(#us)">
          <path d="M0 0h640v480H0z" fill="#fff"/>
          <path d="M0 0h640v37h-640zM0 74h640v37h-640zM0 148h640v37h-640zM0 222h640v37h-640zM0 296h640v37h-640zM0 370h640v37h-640zM0 444h640v36h-640z" fill="#d22630"/>
          <path d="M0 0h364v258H0z" fill="#46467f"/>
        </g>
      </svg>
    ),
    es: (
      <svg className="w-5 h-4" viewBox="0 0 750 500" xmlns="http://www.w3.org/2000/svg">
        <rect width="750" height="500" fill="#c60b1e"/>
        <rect width="750" height="250" y="125" fill="#ffc400"/>
      </svg>
    ),
    ar: (
      <svg className="w-5 h-4" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="900" height="600" fill="#c1272d"/>
        <path d="M450 225l-53.455 164.45L266 225l130.545 94.55L266 414.1l130.545-94.55L450 484l53.455-164.45L634 414.1l-130.545-94.55L634 225l-130.545 94.55L450 225z" fill="#006233"/>
      </svg>
    )
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
          <span className="flex items-center justify-center">{languageFlags[lang]}</span>
          {showLabels && (
            <span className="text-sm font-medium ml-2">
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
    // Cycle through languages: en -> es -> ar -> en
    if (locale === 'en') {
      setLocale('es');
    } else if (locale === 'es') {
      setLocale('ar');
    } else {
      setLocale('en');
    }
  };

  const compactLanguageFlags = {
    en: (
      <svg className="w-4 h-3" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="us-compact">
            <path d="M0 0h640v480H0z"/>
          </clipPath>
        </defs>
        <g clipPath="url(#us-compact)">
          <path d="M0 0h640v480H0z" fill="#fff"/>
          <path d="M0 0h640v37h-640zM0 74h640v37h-640zM0 148h640v37h-640zM0 222h640v37h-640zM0 296h640v37h-640zM0 370h640v37h-640zM0 444h640v36h-640z" fill="#d22630"/>
          <path d="M0 0h364v258H0z" fill="#46467f"/>
        </g>
      </svg>
    ),
    es: (
      <svg className="w-4 h-3" viewBox="0 0 750 500" xmlns="http://www.w3.org/2000/svg">
        <rect width="750" height="500" fill="#c60b1e"/>
        <rect width="750" height="250" y="125" fill="#ffc400"/>
      </svg>
    ),
    ar: (
      <svg className="w-4 h-3" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="900" height="600" fill="#c1272d"/>
        <path d="M450 225l-53.455 164.45L266 225l130.545 94.55L266 414.1l130.545-94.55L450 484l53.455-164.45L634 414.1l-130.545-94.55L634 225l-130.545 94.55L450 225z" fill="#006233"/>
      </svg>
    )
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
      title={`Switch to ${locale === 'en' ? 'Español' : locale === 'es' ? 'العربية' : 'English'}`}
    >
      <span className="flex items-center justify-center">{compactLanguageFlags[locale]}</span>
    </motion.button>
  );
}