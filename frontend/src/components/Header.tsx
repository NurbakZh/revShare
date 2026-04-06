'use client'

import { HeaderNav } from '@/components/HeaderNav'
import { RoleToggle } from '@/components/RoleToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fetchBusinessesByOwner, fetchUser } from '@/lib/api/oracle'
import { useAppStore } from '@/lib/store'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export function Header() {
    const { publicKey, connected } = useWallet()
    const { setHasBusiness } = useAppStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!publicKey) {
            setHasBusiness(false)
            return
        }
        let cancelled = false
        ;(async () => {
            const r = await fetchUser(publicKey.toBase58())
            if (cancelled) return
            if (r.success && r.data?.hasBusiness) {
                setHasBusiness(true)
                return
            }
            const owned = await fetchBusinessesByOwner(publicKey.toBase58())
            if (cancelled) return
            setHasBusiness(owned.length > 0)
        })()
        return () => {
            cancelled = true
        }
    }, [publicKey, setHasBusiness])

    return (
        <header className='sticky top-0 z-[100]'>
            <div
                className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(28rem,50vh)]'
                aria-hidden
            >
                <div
                    className='absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_-5%,rgba(139,92,246,0.26),transparent_68%)] dark:bg-[radial-gradient(ellipse_95%_75%_at_50%_-5%,rgba(167,139,250,0.22),transparent_68%)]'
                />
                <div
                    className='absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(34,211,238,0.13),transparent_62%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(34,211,238,0.1),transparent_62%)]'
                />
                <div className='absolute inset-0 bg-gradient-to-b from-violet-400/9 via-transparent to-transparent dark:from-violet-500/12' />
            </div>

            <nav className='relative border-b border-border/30 bg-background/70 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 dark:border-border/25'>
                <div className='container mx-auto flex flex-wrap items-center justify-between gap-3 px-4'>
                    <Link
                        href='/'
                        className='bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent'
                    >
                        revShare
                    </Link>
                    <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                        <HeaderNav />
                        {mounted && connected && <RoleToggle />}
                        <ThemeToggle />
                        {!mounted ? (
                            <div
                                className='h-10 min-w-[140px] animate-pulse rounded-lg bg-muted/50'
                                aria-hidden
                            />
                        ) : connected ? (
                            <div className='flex items-center gap-2 sm:gap-3'>
                                <Link
                                    href='/profile'
                                    className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/90 hover:text-foreground'
                                >
                                    <div className='h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500' />
                                    Profile
                                </Link>
                                <WalletMultiButton className='!rounded-lg !bg-gradient-to-r !from-violet-600 !to-blue-600 !text-sm !font-medium !text-white !shadow-[0_0_0_1px_rgba(255,255,255,0.06)]' />
                            </div>
                        ) : (
                            <WalletMultiButton className='!rounded-lg !bg-gradient-to-r !from-violet-600 !to-blue-600 !text-sm !font-medium !text-white !shadow-[0_0_0_1px_rgba(255,255,255,0.06)]' />
                        )}
                    </div>
                </div>
            </nav>
        </header>
    )
}
