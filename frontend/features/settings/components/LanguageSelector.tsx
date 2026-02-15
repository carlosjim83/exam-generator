'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { preferencesService } from '@/lib/services/api-preferences.service';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export function LanguageSelector() {
  const { i18n, t } = useTranslation('settings');

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as 'en' | 'es';

    // Update i18n immediately for instant UI feedback
    i18n.changeLanguage(newLanguage);

    // Persist to localStorage immediately
    localStorage.setItem('i18nextLng', newLanguage);

    // Also persist to API in background (not awaited - fire and forget)
    preferencesService.updatePreferences({ language: newLanguage }).catch((error) => {
      console.error('Failed to persist language preference to API:', error);
    });
  };

  // Listen to storage events to detect changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'i18nextLng' && event.newValue) {
        i18n.changeLanguage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
        <Globe className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <label
          htmlFor="language-select"
          className="mb-1 block text-sm font-medium text-card-foreground"
        >
          <span suppressHydrationWarning>{t('preferences.language.label')}</span>
        </label>
        <select
          id="language-select"
          value={i18n.language}
          onChange={handleLanguageChange}
          className="block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
