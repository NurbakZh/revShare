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

                'rounded-3xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-xl transition-all duration-300',

                'dark:border-border/40 dark:bg-card/55 dark:shadow-black/20',

                variant === 'hover' &&

                    'hover:border-border/70 hover:shadow-md dark:hover:border-border/55',

                variant === 'bordered' &&

                    'border-primary/15 dark:border-primary/25',

                onClick && 'cursor-pointer',

                className,

            )}

        >

            {children}

        </div>

    );

}

