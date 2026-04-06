import { cn } from '@/lib/utils';
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'flex h-12 w-full rounded-2xl border border-border/50 bg-background/80 px-4 py-3 text-sm text-foreground ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:border-border/70 hover:bg-background focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border/40 dark:bg-card/55 dark:hover:bg-card/70',
                    error &&
                        'border-destructive focus-visible:ring-destructive/50',
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';

export { Input };
