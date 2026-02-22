import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as React from 'react';
import enCommon from './lib/i18n/locales/en/common.json';
import enExams from './lib/i18n/locales/en/exams.json';
import enStudent from './lib/i18n/locales/en/student.json';
import enClasses from './lib/i18n/locales/en/classes.json';
import enDashboard from './lib/i18n/locales/en/dashboard.json';
import enUpload from './lib/i18n/locales/en/upload.json';
import enSettings from './lib/i18n/locales/en/settings.json';

const allTranslations = {
  common: enCommon,
  exams: enExams,
  student: enStudent,
  classes: enClasses,
  dashboard: enDashboard,
  upload: enUpload,
  settings: enSettings,
};

function getNestedValue(obj: any, path: string): any {
  const keys = path.replace(/^classes:/, '').split(':');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return undefined;
  }
  return result;
}

function translate(key: string): string {
  // Try to find the translation
  for (const [namespace, translations] of Object.entries(allTranslations)) {
    if (key.startsWith(`${namespace}:`)) {
      const value = getNestedValue(translations, key.replace(`${namespace}:`, ''));
      if (value !== undefined) return value;
    }
  }
  // Try common namespace
  const commonValue = getNestedValue(enCommon, key);
  if (commonValue !== undefined) return commonValue;

  // Return key if not found
  return key;
}

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock i18next with real translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translate(key),
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => {
    return React.createElement('a', { href }, children);
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'true';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;
