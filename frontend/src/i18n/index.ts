import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import sv from './locales/sv.json';

// Locale persistence utilities
export function saveLocale(locale: string): void {
  try {
    localStorage.setItem('user-locale', locale);
  } catch (error) {
    console.warn('Failed to save locale to localStorage:', error);
  }
}

export function loadLocale(): string | null {
  try {
    return localStorage.getItem('user-locale');
  } catch (error) {
    console.warn('Failed to load locale from localStorage:', error);
    return null;
  }
}

export function detectBrowserLanguage(): string {
  try {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      // Extract language code (e.g., 'sv-SE' -> 'sv')
      const langCode = browserLang.split('-')[0].toLowerCase();
      // Return if supported, otherwise fallback to 'en'
      return ['en', 'sv'].includes(langCode) ? langCode : 'en';
    }
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
  }
  return 'en';
}

// Detect initial locale: localStorage → browser → fallback to 'en'
function getInitialLocale(): string {
  const savedLocale = loadLocale();
  if (savedLocale && ['en', 'sv'].includes(savedLocale)) {
    return savedLocale;
  }
  return detectBrowserLanguage();
}

// Number formats for each locale
const numberFormats = {
  en: {
    currency: {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    integer: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  },
  sv: {
    currency: {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    integer: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  },
};

// Date-time formats for each locale
const datetimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  },
  sv: {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  },
};

// Create i18n instance
export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    sv,
  },
  numberFormats,
  datetimeFormats,
  missingWarn: import.meta.env.DEV, // Warn about missing keys in development only
  fallbackWarn: import.meta.env.DEV,
});

// Update HTML lang attribute when locale changes
export function updateHtmlLang(locale: string): void {
  document.documentElement.setAttribute('lang', locale);
}

// Initialize HTML lang on load
updateHtmlLang(i18n.global.locale.value);
