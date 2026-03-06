import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
import settingsEN from './locales/en/settings.json';
import settingsES from './locales/es/settings.json';
import studentEN from './locales/en/student.json';
import studentES from './locales/es/student.json';
import classesEN from './locales/en/classes.json';
import classesES from './locales/es/classes.json';
import landingEN from './locales/en/landing.json';
import landingES from './locales/es/landing.json';

// Define resources type
const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    exams: examsEN,
    documents: documentsEN,
    upload: uploadEN,
    generate: generateEN,
    settings: settingsEN,
    student: studentEN,
    classes: classesEN,
    landing: landingEN,
  },
  es: {
    common: commonES,
    dashboard: dashboardES,
    exams: examsES,
    documents: documentsES,
    upload: uploadES,
    generate: generateES,
    settings: settingsES,
    student: studentES,
    classes: classesES,
    landing: landingES,
  },
} as const;

i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: 'en', // Force 'en' on both server and client to prevent hydration mismatch
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'dashboard',
      'exams',
      'documents',
      'upload',
      'generate',
      'settings',
      'student',
      'classes',
      'landing',
    ],

    detection: {
      // Detect from localStorage for manual language changes
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });

export default i18n;
