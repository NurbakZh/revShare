'use client'

import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Старый URL: переключаем режим Business и открываем единый дэшборд. */
export default function BusinessLegacyPage() {
    const router = useRouter()
    const setRole = useAppStore((s) => s.setRole)

    useEffect(() => {
        setRole('business')
        router.replace('/dashboard')
    }, [router, setRole])

    return (
        <div className='container mx-auto px-4 py-16 text-center text-muted-foreground'>
            Redirecting…
        </div>
    )
}
