'use client';

import { useThemeStore } from '@/lib/store';
import { useEffect } from 'react';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme, fromSystem, setTheme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (targetTheme: 'dark' | 'light') => {
            root.classList.remove('light', 'dark');
            root.classList.add(targetTheme);
        };

        if (fromSystem) {
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)',
            ).matches
                ? 'dark'
                : 'light';
            applyTheme(systemTheme);

            const mediaQuery = window.matchMedia(
                '(prefers-color-scheme: dark)',
            );
            const handleChange = (e: MediaQueryListEvent) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            applyTheme(theme);
        }
    }, [theme, fromSystem]);

    return <>{children}</>;
}
