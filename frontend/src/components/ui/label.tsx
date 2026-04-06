import { cn } from '@/lib/utils'
import * as React from 'react'

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean
    hint?: string
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, required, hint, children, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    'mb-2 block text-sm font-medium text-muted-foreground',
                    className,
                )}
                {...props}
            >
                {children}
                {required && (
                    <>
                        {' '}
                        <span className='text-destructive' aria-hidden>
                            *
                        </span>
                    </>
                )}
                {hint ? (
                    <span className='font-normal text-muted-foreground'>
                        {' '}
                        {hint}
                    </span>
                ) : null}
            </label>
        )
    },
)
Label.displayName = 'Label'

export { Label }
