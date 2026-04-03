'use client';

import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme, fromSystem } = useAppStore();

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
        } else {
            applyTheme(theme);
        }
    }, [theme, fromSystem]);

    return <>{children}</>;
}
