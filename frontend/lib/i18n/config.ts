import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import commonES from './locales/es/common.json';
import dashboardEN from './locales/en/dashboard.json';
import dashboardES from './locales/es/dashboard.json';
import examsEN from './locales/en/exams.json';
import examsES from './locales/es/exams.json';
import documentsEN from './locales/en/documents.json';
import documentsES from './locales/es/documents.json';
import uploadEN from './locales/en/upload.json';
import uploadES from './locales/es/upload.json';
import generateEN from './locales/en/generate.json';
import generateES from './locales/es/generate.json';

// Define resources type
const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    exams: examsEN,
    documents: documentsEN,
    upload: uploadEN,
    generate: generateEN,
  },
  es: {
    common: commonES,
    dashboard: dashboardES,
    exams: examsES,
    documents: documentsES,
    upload: uploadES,
    generate: generateES,
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
    ns: ['common', 'dashboard', 'exams', 'documents', 'upload', 'generate'],

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
