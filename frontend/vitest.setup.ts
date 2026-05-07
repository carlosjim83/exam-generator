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

const allTranslations: Record<string, unknown> = {
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

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  const keys = path.split(/[:.]/).filter(Boolean);
  let result: unknown = obj;
  for (const key of keys) {
    if (result === undefined || result === null) return undefined;
    if (typeof result === 'object' && result !== null) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
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
      if (typeof value === 'string') return value;
    }
  }

  if (hasDot) {
    const commonNested = getNestedValue(enCommon, key);
    if (typeof commonNested === 'string') return commonNested;

    for (const [, translations] of Object.entries(allTranslations)) {
      const value = getNestedValue(translations, key);
      if (typeof value === 'string') return value;
    }
  }

  const commonValue = getNestedValue(enCommon, key);
  if (typeof commonValue === 'string') return commonValue;

  return key;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      let value = translate(key);

      if (options) {
        if (typeof options.count === 'number') {
          value = value.replaceAll('{{count}}', String(options.count));
        }
        Object.entries(options).forEach(([k, v]) => {
          if (k !== 'count' && v !== undefined) {
            value = value.replaceAll(`{{${k}}}`, String(v));
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
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
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
