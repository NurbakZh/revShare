'use client';

import { useAppStore } from '@/lib/store';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useAppStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className='h-9 w-9' />;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='bg-accent/50 hover:bg-accent text-foreground rounded-xl p-2 transition-all active:scale-95'
            aria-label='Toggle theme'
        >
            {theme === 'dark' ? (
                <Sun className='h-5 w-5 text-yellow-500' />
            ) : (
                <Moon className='h-5 w-5 text-slate-700' />
            )}
        </button>
    );
}
