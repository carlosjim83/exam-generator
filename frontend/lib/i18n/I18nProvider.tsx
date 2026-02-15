'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  // Sync language from localStorage after hydration
  // This ensures the language persisted by the user is used after refresh
  useEffect(() => {
    const savedLng = localStorage.getItem('i18nextLng');
    if (savedLng && savedLng !== i18n.language) {
      i18n.changeLanguage(savedLng);
    }
  }, []);

  return <>{children}</>;
}
