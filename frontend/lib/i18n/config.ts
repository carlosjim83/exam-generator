import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import commonES from './locales/es/common.json';
import dashboardEN from './locales/en/dashboard.json';
import dashboardES from './locales/es/dashboard.json';

// Define resources type
const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
  },
  es: {
    common: commonES,
    dashboard: dashboardES,
  },
} as const;

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: ['en'],
    defaultNS: 'common',
    ns: ['common', 'dashboard'],

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language selection
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
