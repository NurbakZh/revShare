'use client';

import { useAppStore } from '@/lib/store';
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme, fromSystem } = useAppStore();

    useIsomorphicLayoutEffect(() => {
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

    useEffect(() => {
        if (!fromSystem) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const root = window.document.documentElement;
        const apply = () => {
            root.classList.remove('light', 'dark');
            root.classList.add(mq.matches ? 'dark' : 'light');
        };
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, [fromSystem]);

    return <>{children}</>;
}
