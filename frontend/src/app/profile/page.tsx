'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { fetchUser, registerUser } from '@/lib/api/oracle'
import { useAppStore } from '@/lib/store'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { Building2, Plus, User, Wallet } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

export default function ProfilePage() {
    const { publicKey, connected, disconnect } = useWallet()
    const { hasBusiness, setHasBusiness } = useAppStore()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const syncUser = useCallback(async () => {
        if (!publicKey) return
        setLoading(true)
        const r = await fetchUser(publicKey.toBase58())
        if (r.success && r.data) {
            setName(r.data.name)
            setHasBusiness(r.data.hasBusiness)
        } else {
            const reg = await registerUser({
                pubkey: publicKey.toBase58(),
                name: `User ${publicKey.toBase58().slice(0, 4)}`,
            })
            if (reg.success && reg.data) {
                setName(reg.data.name)
                setHasBusiness(reg.data.hasBusiness)
            }
        }
        setLoading(false)
    }, [publicKey, setHasBusiness])

    useEffect(() => {
        if (connected && publicKey) syncUser()
    }, [connected, publicKey, syncUser])

    if (!connected || !publicKey) {
        return (
            <div className='container mx-auto px-4 py-20 text-center'>
                <GlassCard className='mx-auto max-w-md p-8'>
                    <Wallet
                        size={48}
                        className='mx-auto mb-4 text-muted-foreground'
                    />
                    <h1 className='mb-4 text-2xl font-bold'>
                        Connect your wallet
                    </h1>
                    <p className='mb-6 text-muted-foreground'>
                        Connect Phantom. Profile syncs with the API.
                    </p>
                    <WalletMultiButton className='!mx-auto !flex !rounded-xl !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white' />
                </GlassCard>
            </div>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='mb-8 flex items-center justify-between'>
                <h1 className='text-4xl font-bold text-foreground'>
                    My profile
                </h1>
                <Button variant='outline' onClick={() => disconnect()}>
                    Disconnect
                </Button>
            </div>

            <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
                <GlassCard className='h-fit p-8 lg:col-span-1'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-3xl font-bold text-white'>
                            <User className='text-white' size={40} />
                        </div>
                        <h2 className='text-xl font-bold text-foreground'>
                            {loading ? '…' : name || '—'}
                        </h2>
                        <p className='mt-1 font-mono text-xs text-muted-foreground break-all'>
                            {publicKey.toBase58()}
                        </p>
                    </div>
                </GlassCard>

                <div className='space-y-8 lg:col-span-2'>
                    <GlassCard className='mb-8 p-8'>
                        <div className='mb-6 flex items-center justify-between'>
                            <h2 className='text-2xl font-bold text-foreground'>
                                Business account
                            </h2>
                            {hasBusiness ? (
                                <span className='rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-500'>
                                    Active
                                </span>
                            ) : (
                                <span className='rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-500'>
                                    Not created
                                </span>
                            )}
                        </div>

                        {hasBusiness ? (
                            <p className='text-muted-foreground'>
                                Linked to a business. Use the business dashboard.
                            </p>
                        ) : (
                            <div className='py-8 text-center'>
                                <Building2
                                    size={48}
                                    className='mx-auto mb-4 text-muted-foreground/30'
                                />
                                <h3 className='mb-2 text-xl font-bold'>
                                    Create a business pool on-chain
                                </h3>
                                <p className='mx-auto mb-8 max-w-sm text-muted-foreground'>
                                    Deploy a pool and register in the API.
                                </p>
                                <Button variant='brand' asChild className='gap-2'>
                                    <Link href='/create-business'>
                                        <Plus size={20} />
                                        Create business
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
