'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export function ThemeProvider({ children }) {
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
