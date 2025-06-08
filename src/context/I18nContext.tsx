'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Import translation files
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

type Locale = 'en' | 'es';

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Locale[];
}

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  es: esTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>('es'); // Default to Spanish

  // Extract locale from URL and check localStorage
  useEffect(() => {
    // First check URL for locale
    const pathSegments = pathname.split('/');
    const urlLocale = pathSegments[1] as Locale;
    
    if (urlLocale && ['en', 'es'].includes(urlLocale)) {
      setLocaleState(urlLocale);
      // Store this locale preference
      localStorage.setItem('preferred-locale', urlLocale);
    } else {
      // If no locale in URL, check localStorage for preference
      const storedLocale = localStorage.getItem('preferred-locale') as Locale | null;
      
      if (storedLocale && ['en', 'es'].includes(storedLocale)) {
        // Use stored preference
        setLocaleState(storedLocale);
        // Update URL without page refresh
        const newPath = `/${storedLocale}${pathname}`;
        window.history.replaceState(null, '', newPath);
      } else {
        // Default to Spanish if no preference found
        setLocaleState('es');
        const newPath = `/es${pathname}`;
        window.history.replaceState(null, '', newPath);
      }
    }
  }, [pathname]);

  // Function to change locale and update URL without page refresh
  const setLocale = (newLocale: Locale) => {
    const pathSegments = pathname.split('/');
    const currentLocale = pathSegments[1];
    
    let newPath;
    if (['en', 'es'].includes(currentLocale)) {
      // Replace existing locale
      pathSegments[1] = newLocale;
      newPath = pathSegments.join('/');
    } else {
      // Add locale to path
      newPath = `/${newLocale}${pathname}`;
    }
    
    // Update state immediately for instant UI change
    setLocaleState(newLocale);
    
    // Update URL without page refresh
    window.history.replaceState(null, '', newPath);
    
    // Store locale preference in localStorage
    localStorage.setItem('preferred-locale', newLocale);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: string | Translations = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current locale
        let fallbackValue: string | Translations = translations['en'];
        for (const fallbackK of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackK in fallbackValue) {
            fallbackValue = fallbackValue[fallbackK];
          } else {
            return key; // Return key if not found in any locale
          }
        }
        value = fallbackValue;
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  const availableLocales: Locale[] = ['en', 'es'];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Export the translation function for use outside components
export function createT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: string | Translations = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        let fallbackValue: string | Translations = translations['en'];
        for (const fallbackK of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackK in fallbackValue) {
            fallbackValue = fallbackValue[fallbackK];
          } else {
            return key;
          }
        }
        value = fallbackValue;
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };
}