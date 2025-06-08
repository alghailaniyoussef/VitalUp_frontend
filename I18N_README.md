# VitalUp Internationalization (i18n) System

This document explains how to use the internationalization system implemented in VitalUp.

## Overview

The VitalUp application now supports multiple languages (English and Spanish) using a custom i18n implementation with:
- JSON translation files
- React Context for state management
- URL-based language detection
- Language toggle component
- Middleware for automatic redirects

## Supported Languages

- **Spanish (es)** - Default language
- **English (en)**

## File Structure

```
frontend/src/
├── locales/
│   ├── en.json          # English translations
│   └── es.json          # Spanish translations
├── context/
│   └── I18nContext.tsx  # i18n React Context
├── components/
│   └── LanguageToggle.tsx # Language switcher component
├── utils/
│   └── i18n.ts          # Utility functions
└── middleware.ts        # Route handling middleware
```

## How to Use

### 1. Using Translations in Components

```tsx
import { useI18n } from '@/context/I18nContext';

function MyComponent() {
  const { t, locale } = useI18n();
  
  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <p>{t('common.loading')}</p>
      <Link href={`/${locale}/profile`}>Profile</Link>
    </div>
  );
}
```

### 2. Using Translations with Parameters

```tsx
const { t } = useI18n();

// Translation with parameters
const message = t('welcome.message', { name: 'John', points: 150 });
```

### 3. Adding New Translations

1. Add the key-value pair to both `en.json` and `es.json`:

**en.json:**
```json
{
  "mySection": {
    "title": "My Title",
    "description": "Welcome {{name}}, you have {{points}} points"
  }
}
```

**es.json:**
```json
{
  "mySection": {
    "title": "Mi Título",
    "description": "Bienvenido {{name}}, tienes {{points}} puntos"
  }
}
```

2. Use in your component:
```tsx
const title = t('mySection.title');
const description = t('mySection.description', { name: 'Juan', points: 150 });
```

### 4. Language Toggle Component

```tsx
import LanguageToggle, { LanguageToggleCompact } from '@/components/LanguageToggle';

// Full language toggle with labels
<LanguageToggle />

// Compact version (flags only)
<LanguageToggleCompact />
```

### 5. Using Translations Outside Components

```tsx
import { getTranslation, createTranslator } from '@/utils/i18n';

// Direct translation
const text = getTranslation('es', 'common.loading');

// Create a translator function
const t = createTranslator('en');
const text2 = t('navigation.dashboard');
```

## URL Structure

All routes are now prefixed with the language code:

- `/es` - Spanish home page (default)
- `/en` - English home page
- `/es/dashboard` - Spanish dashboard
- `/en/dashboard` - English dashboard
- `/es/auth/signin` - Spanish sign in page
- `/en/auth/signin` - English sign in page

## How Language Switching Works

1. **URL Detection**: The middleware detects the language from the URL
2. **Automatic Redirect**: If no language is specified, redirects to default (Spanish)
3. **Context Update**: The I18nContext updates when the URL changes
4. **Language Toggle**: Clicking the language toggle updates the URL and context

## Translation Key Structure

Translations are organized by sections:

```json
{
  "navigation": { ... },
  "common": { ... },
  "auth": { ... },
  "dashboard": { ... },
  "quiz": { ... },
  "challenges": { ... },
  "badges": { ... },
  "profile": { ... },
  "features": { ... },
  "admin": { ... },
  "home": { ... }
}
```

## Best Practices

1. **Consistent Key Naming**: Use dot notation (e.g., `section.subsection.key`)
2. **Fallback Handling**: The system automatically falls back to English if a key is missing
3. **Parameter Syntax**: Use `{{paramName}}` for dynamic values
4. **Link Prefixing**: Always prefix internal links with `/${locale}`
5. **Component Updates**: Update existing components to use `t()` function instead of hardcoded text

## Adding New Languages

1. Create a new JSON file in `/locales/` (e.g., `fr.json`)
2. Add the locale to the `locales` array in:
   - `I18nContext.tsx`
   - `middleware.ts`
   - `utils/i18n.ts`
3. Update the `LanguageToggle` component to include the new language
4. Add translations for all existing keys

## Testing

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3002`
3. The app should redirect to `http://localhost:3002/es`
4. Use the language toggle to switch between languages
5. Verify that URLs update correctly and translations change

## Troubleshooting

- **Missing translations**: Check browser console for warnings about missing keys
- **URL issues**: Ensure all internal links include the locale prefix
- **Context errors**: Make sure components using `useI18n()` are wrapped in `I18nProvider`
- **Middleware issues**: Check that middleware is not interfering with API routes or static files