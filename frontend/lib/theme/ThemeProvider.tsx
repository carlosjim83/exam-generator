'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { preferencesService } from '@/lib/services/api-preferences.service';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from API on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const preferences = await preferencesService.getPreferences();
        setThemeState(preferences.theme);
        applyTheme(preferences.theme);
      } catch (error) {
        // If API fails, check localStorage as fallback
        const localTheme = localStorage.getItem('theme') as Theme | null;
        if (localTheme) {
          setThemeState(localTheme);
          applyTheme(localTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to DOM
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // Set theme and persist to API
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    // Persist to API in background
    try {
      await preferencesService.updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error('Failed to persist theme preference:', error);
      // Theme is still applied locally even if API fails
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
