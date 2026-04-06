'use client'

import { useAppStore } from '@/lib/store'
import type { UserRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Building2, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export function RoleToggle() {
    const { role, setRole } = useAppStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    function select(next: UserRole) {
        setRole(next)
    }

    if (!mounted) {
        return (
            <div
                className='h-10 w-[188px] rounded-xl border border-border/40 bg-muted/30 dark:border-border/35'
                aria-hidden
            />
        )
    }

    const base =
        'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200'
    const active =
        'bg-violet-500/15 text-foreground shadow-sm ring-1 ring-violet-500/25 dark:bg-violet-500/18 dark:ring-violet-400/30'

    return (
        <div
            className='rounded-xl border border-border/50 bg-muted/35 p-1 shadow-sm ring-1 ring-black/[0.03] dark:border-border/45 dark:bg-muted/25 dark:ring-white/[0.04]'
            role='group'
            aria-label='View mode for dashboard'
        >
            <div className='flex items-stretch gap-0.5'>
                <button
                    type='button'
                    onClick={() => select('investor')}
                    className={cn(
                        base,
                        role === 'investor'
                            ? active
                            : 'text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/10',
                    )}
                >
                    <User size={16} strokeWidth={2} aria-hidden />
                    Investor
                </button>
                <button
                    type='button'
                    onClick={() => select('business')}
                    className={cn(
                        base,
                        role === 'business'
                            ? active
                            : 'text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/10',
                    )}
                >
                    <Building2 size={16} strokeWidth={2} aria-hidden />
                    Business
                </button>
            </div>
        </div>
    )
}
