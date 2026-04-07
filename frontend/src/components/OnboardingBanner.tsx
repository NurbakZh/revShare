'use client'

import { isLocalnet } from '@/lib/env'
import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'revshare_onboarding_dismissed'

const STEPS = [
    { emoji: '🔗', text: 'Connect Phantom wallet' },
    { emoji: '📊', text: 'Browse businesses' },
    { emoji: '🪙', text: 'Buy revenue-share tokens' },
    { emoji: '💸', text: 'Earn monthly dividends' },
]

export function OnboardingBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY)
        if (!dismissed) setVisible(true)
    }, [])

    function dismiss() {
        localStorage.setItem(STORAGE_KEY, '1')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className='relative border-b border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10 px-4 py-4'>
            <div className='container mx-auto'>
                <div className='flex flex-wrap items-center gap-4'>
                    <p className='text-sm font-semibold text-foreground'>
                        Welcome to revShare — how it works:
                    </p>

                    <div className='flex flex-wrap items-center gap-2'>
                        {STEPS.map((step, i) => (
                            <React.Fragment key={i}>
                                <span className='flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-sm'>
                                    <span>{step.emoji}</span>
                                    <span className='text-muted-foreground'>{step.text}</span>
                                </span>
                                {i < STEPS.length - 1 && (
                                    <ArrowRight
                                        size={14}
                                        className='shrink-0 text-muted-foreground/40'
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {isLocalnet() && (
                        <Link
                            href='/demo'
                            className='ml-auto shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500'
                        >
                            Get demo wallets
                        </Link>
                    )}
                </div>
            </div>

            <button
                onClick={dismiss}
                className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                aria-label='Dismiss'
            >
                <X size={16} />
            </button>
        </div>
    )
}
