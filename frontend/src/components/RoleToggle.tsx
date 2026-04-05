'use client'

import { useAppStore } from '@/lib/store'
import type { UserRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Building2, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function RoleToggle() {
    const { role, setRole } = useAppStore()
    const router = useRouter()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    function select(next: UserRole) {
        setRole(next)
        if (pathname !== '/dashboard') {
            router.push('/dashboard')
        }
    }

    if (!mounted) return <div className='h-10 w-[180px]' />

    return (
        <div className='flex rounded-xl border border-border bg-accent/50 p-1'>
            <button
                type='button'
                onClick={() => select('investor')}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300',
                    role === 'investor'
                        ? 'scale-105 bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                <User size={18} />
                Investor
            </button>
            <button
                type='button'
                onClick={() => select('business')}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300',
                    role === 'business'
                        ? 'scale-105 bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                <Building2 size={18} />
                Business
            </button>
        </div>
    )
}
