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
import enDocuments from './lib/i18n/locales/en/documents.json';
import enGenerate from './lib/i18n/locales/en/generate.json';

const allTranslations: Record<string, any> = {
  common: enCommon,
  exams: enExams,
  student: enStudent,
  classes: enClasses,
  dashboard: enDashboard,
  upload: enUpload,
  settings: enSettings,
  documents: enDocuments,
  generate: enGenerate,
};

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.split(/[:.]/).filter(Boolean);
  let result = obj;
  for (const key of keys) {
    if (result === undefined || result === null) return undefined;
    result = result[key];
  }
  return result;
}

function translate(key: string): string {
  if (!key) return key;

  const colonIndex = key.indexOf(':');
  const hasDot = key.includes('.');

  if (colonIndex > 0) {
    const namespace = key.substring(0, colonIndex);
    const actualKey = key.substring(colonIndex + 1);
    const translations = allTranslations[namespace];
    if (translations) {
      const value = getNestedValue(translations, actualKey);
      if (value !== undefined) return value;
    }
  }

  if (hasDot) {
    const commonNested = getNestedValue(enCommon, key);
    if (commonNested !== undefined) return commonNested;

    for (const [ns, translations] of Object.entries(allTranslations)) {
      if (ns === 'common') continue;
      const value = getNestedValue(translations, key);
      if (value !== undefined) return value;
    }
  }

  const commonValue = getNestedValue(enCommon, key);
  if (commonValue !== undefined) return commonValue;

  return key;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      let value = translate(key);

      if (options) {
        if (options.count !== undefined && typeof options.count === 'number') {
          value = value.replace(/\{\{count\}\}/g, String(options.count));
        }
        Object.entries(options).forEach(([k, v]) => {
          if (k !== 'count' && v !== undefined) {
            value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
          }
        });
      }

      return value;
    },
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

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => {
    return React.createElement('a', { href }, children);
  },
}));

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_USE_MOCK_OAUTH = 'true';

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

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;
