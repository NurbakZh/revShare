'use client'

import { HeaderNav } from '@/components/HeaderNav'
import { RoleToggle } from '@/components/RoleToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fetchUser } from '@/lib/api/oracle'
import { useAppStore } from '@/lib/store'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import React, { useEffect } from 'react'

export function Header() {
    const { publicKey, connected } = useWallet()
    const { hasBusiness, setHasBusiness } = useAppStore()

    useEffect(() => {
        if (!publicKey) {
            setHasBusiness(false)
            return
        }
        let cancelled = false
        fetchUser(publicKey.toBase58()).then((r) => {
            if (cancelled) return
            if (r.success && r.data) setHasBusiness(r.data.hasBusiness)
        })
        return () => {
            cancelled = true
        }
    }, [publicKey, setHasBusiness])

    return (
        <nav className='sticky top-0 z-[100] border-b border-border bg-background/80 p-4 backdrop-blur-md'>
            <div className='container mx-auto flex items-center justify-between'>
                <Link
                    href='/'
                    className='cursor-pointer bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'
                >
                    revShare
                </Link>
                <div className='flex items-center gap-6'>
                    <HeaderNav />
                    <div className='mx-2 h-8 w-[1px] bg-border' />
                    {connected && hasBusiness && <RoleToggle />}
                    <ThemeToggle />
                    {connected ? (
                        <div className='flex items-center gap-3'>
                            <Link
                                href='/profile'
                                className='flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium transition-all hover:bg-accent/80'
                            >
                                <div className='h-6 w-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600' />
                                Profile
                            </Link>
                            <WalletMultiButton className='!rounded-xl !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-sm !font-medium !text-white' />
                        </div>
                    ) : (
                        <WalletMultiButton className='!rounded-xl !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-sm !font-medium !text-white' />
                    )}
                </div>
            </div>
        </nav>
    )
}
