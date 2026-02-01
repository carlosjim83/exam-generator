'use client';

import { useEffect } from 'react';
import '@/lib/i18n/config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n is already initialized in config.ts
    // This component just ensures the config is loaded
  }, []);

  return <>{children}</>;
}
