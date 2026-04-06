'use client'

import type { UserRole } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function LegacyDashboardRedirect({ role }: { role: UserRole }) {
    const router = useRouter()
    const setRole = useAppStore((s) => s.setRole)

    useEffect(() => {
        setRole(role)
        router.replace('/dashboard')
    }, [router, setRole, role])

    return (
        <div className='container mx-auto px-4 py-16 text-center text-muted-foreground'>
            Redirecting…
        </div>
    )
}
