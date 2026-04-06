import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline:
                    'border border-border/50 bg-background/80 shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-border/40',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                brand: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/50',
                outlined:
                    'border-2 border-brand-green text-brand-green hover:bg-brand-green/10',
            },
            size: {
                default: 'h-12 px-6 py-3',
                sm: 'h-9 rounded-xl px-4 text-xs',
                md: 'h-12 px-6 py-3',
                lg: 'h-14 rounded-2xl px-10 text-lg',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
