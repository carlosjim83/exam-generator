'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

  // Load theme from localStorage only (no API dependency)
  useEffect(() => {
    const loadTheme = () => {
      const localTheme = localStorage.getItem('theme') as Theme | null;
      if (localTheme) {
        setThemeState(localTheme);
        applyTheme(localTheme);
      }
      setIsLoading(false);
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

  // Set theme and persist to localStorage (API sync removed to prevent auth issues)
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    // Note: Theme is only persisted to localStorage, not API
    // This avoids initialization race conditions with ConfigManager
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
