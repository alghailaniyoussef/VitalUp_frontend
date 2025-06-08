import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

type Locale = 'en' | 'es';

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  es: esTranslations,
};

/**
 * Get a translation value by key
 * @param locale The locale to use
 * @param key The translation key (dot notation)
 * @param params Optional parameters to replace in the translation
 * @returns The translated string
 */
export function getTranslation(locale: Locale, key: string, params?: Record<string, string | number>): string {
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
}

/**
 * Create a translation function for a specific locale
 * @param locale The locale to use
 * @returns A translation function
 */
export function createTranslator(locale: Locale) {
  return (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(locale, key, params);
  };
}

/**
 * Get the default locale
 * @returns The default locale
 */
export function getDefaultLocale(): Locale {
  return 'es';
}

/**
 * Get all available locales
 * @returns Array of available locales
 */
export function getAvailableLocales(): Locale[] {
  return ['en', 'es'];
}