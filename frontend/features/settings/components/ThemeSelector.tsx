'use client';

import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export function ThemeSelector() {
  const { t } = useTranslation('settings');
  const { theme, setTheme, isLoading } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as 'light' | 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-primary" />
        ) : (
          <Sun className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1">
        <label
          htmlFor="theme-select"
          className="mb-1 block text-sm font-medium text-card-foreground"
        >
          <span suppressHydrationWarning>{t('preferences.theme.label')}</span>
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={handleThemeChange}
          disabled={isLoading}
          className="block w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        >
          <option value="light">
            <span suppressHydrationWarning>{t('preferences.theme.light')}</span>
          </option>
          <option value="dark">
            <span suppressHydrationWarning>{t('preferences.theme.dark')}</span>
          </option>
        </select>
      </div>
    </div>
  );
}
