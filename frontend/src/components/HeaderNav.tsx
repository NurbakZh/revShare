'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function HeaderNav() {
    const pathname = usePathname()

    const links = [
        { name: 'Marketplace', href: '/marketplace' },
        { name: 'Dashboard', href: '/dashboard' },
    ]

    return (
        <div className='flex items-center gap-6'>
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        'relative py-1 text-sm font-medium transition-all',
                        pathname === link.href
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {link.name}
                    {pathname === link.href && (
                        <div className='absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary duration-300 animate-in fade-in slide-in-from-left-1' />
                    )}
                </Link>
            ))}
        </div>
    )
}
