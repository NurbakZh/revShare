import { cn } from '@/lib/utils';
import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}: GradientButtonProps) {
    return (
        <button
            className={cn(
                'rounded-2xl font-medium transition-all duration-300 active:scale-95',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center',
                variant === 'primary' &&
                    'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/50 dark:hover:shadow-purple-500/40',
                variant === 'secondary' &&
                    'border border-purple-300/50 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 text-gray-900 hover:border-purple-500/50 dark:border-purple-500/30 dark:text-white',
                variant === 'ghost' &&
                    'bg-transparent text-gray-900 hover:bg-white/10 dark:text-white dark:hover:bg-white/5',
                size === 'sm' && 'px-4 py-2 text-sm',
                size === 'md' && 'px-6 py-3 text-base',
                size === 'lg' && 'px-8 py-4 text-lg',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
