import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'hover' | 'bordered';
    onClick?: () => void;
}

export function GlassCard({
    children,
    className,
    variant = 'default',
    onClick,
}: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-3xl border backdrop-blur-xl transition-all duration-300',
                'dark:border-white/10 dark:bg-zinc-950/90',
                'border-gray-200/50 bg-white/90',
                'shadow-xl dark:shadow-2xl dark:shadow-purple-500/10',
                variant === 'hover' &&
                    'hover:scale-[1.02] hover:shadow-2xl dark:hover:shadow-purple-500/20',
                variant === 'bordered' &&
                    'border-purple-300/50 dark:border-purple-500/30',
                onClick && 'cursor-pointer',
                className,
            )}
        >
            {children}
        </div>
    );
}
