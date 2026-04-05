import { cn } from '@/lib/utils'
import * as React from 'react'

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    'flex min-h-[120px] w-full resize-none rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground ring-offset-background transition-all duration-200 placeholder:text-muted-foreground hover:border-primary/40 hover:bg-white focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-black/60 dark:hover:bg-black/80',
                    error &&
                        'border-destructive focus-visible:ring-destructive/50',
                    className,
                )}
                ref={ref}
                {...props}
            />
        )
    },
)
Textarea.displayName = 'Textarea'

export { Textarea }
