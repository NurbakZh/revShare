'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { isLocalnet } from '@/lib/env'
import { Keypair } from '@solana/web3.js'
import { CheckCircle, Copy, Download, Key, Users, Zap } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface DemoWallet {
    label: string
    role: string
    description: string
    publicKey: string
    secretKeyArray: number[]
}

async function deriveDemoKeypair(name: string): Promise<Keypair> {
    const enc = new TextEncoder().encode(`revshare_demo_${name}_v1`)
    const hashBuf = await crypto.subtle.digest('SHA-256', enc)
    return Keypair.fromSeed(new Uint8Array(hashBuf))
}

export default function DemoPage() {
    const [wallets, setWallets] = useState<DemoWallet[]>([])
    const [copied, setCopied] = useState<string | null>(null)
    const localnet = isLocalnet()

    useEffect(() => {
        ;(async () => {
            const ownerKp = await deriveDemoKeypair('owner')
            const investorKp = await deriveDemoKeypair('investor')

            setWallets([
                {
                    label: 'Demo Owner',
                    role: 'Business Owner',
                    description:
                        'Use this wallet to manage demo businesses, simulate revenue, and release funds.',
                    publicKey: ownerKp.publicKey.toBase58(),
                    secretKeyArray: Array.from(ownerKp.secretKey),
                },
                {
                    label: 'Demo Investor',
                    role: 'Investor',
                    description:
                        'Use this wallet to buy tokens from demo businesses and claim revenue distributions.',
                    publicKey: investorKp.publicKey.toBase58(),
                    secretKeyArray: Array.from(investorKp.secretKey),
                },
            ])
        })()
    }, [])

    function downloadKeypair(wallet: DemoWallet) {
        const blob = new Blob([JSON.stringify(wallet.secretKeyArray)], {
            type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${wallet.label.toLowerCase().replace(' ', '-')}-keypair.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    async function copyPubkey(wallet: DemoWallet) {
        await navigator.clipboard.writeText(wallet.publicKey)
        setCopied(wallet.label)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div className='container mx-auto max-w-3xl px-4 py-8'>
            <div className='mb-8 text-center'>
                <div className='mb-4 flex items-center justify-center gap-2'>
                    <Key size={32} className='text-violet-500' />
                    <h1 className='text-4xl font-bold text-foreground'>Demo Wallets</h1>
                </div>
                <p className='text-muted-foreground'>
                    Pre-funded keypairs for testing on{' '}
                    <span className='font-mono text-cyan-400'>localnet</span>.
                    Import into Phantom to explore the app.
                </p>

                {!localnet && (
                    <div className='mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400'>
                        You are connected to a non-local network. These wallets are for localnet only.
                    </div>
                )}
            </div>

            {/* How to import */}
            <GlassCard className='mb-6 p-6'>
                <h2 className='mb-3 flex items-center gap-2 font-semibold text-foreground'>
                    <Zap size={18} className='text-cyan-400' />
                    How to import into Phantom
                </h2>
                <ol className='space-y-1 text-sm text-muted-foreground'>
                    <li>1. Download the keypair JSON file below</li>
                    <li>2. Open Phantom → Add / Connect wallet → Import private key</li>
                    <li>3. Select "Import from file" and choose the downloaded JSON</li>
                    <li>4. The wallet will be pre-funded with 50 SOL (localnet)</li>
                </ol>
            </GlassCard>

            {/* Wallet cards */}
            <div className='space-y-4'>
                {wallets.map((wallet) => (
                    <GlassCard key={wallet.label} className='p-6'>
                        <div className='mb-4 flex items-start justify-between'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <Users size={18} className='text-violet-400' />
                                    <h2 className='font-bold text-foreground'>{wallet.label}</h2>
                                    <span className='rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400'>
                                        {wallet.role}
                                    </span>
                                </div>
                                <p className='mt-1 text-sm text-muted-foreground'>
                                    {wallet.description}
                                </p>
                            </div>
                        </div>

                        <div className='mb-4 rounded-lg bg-muted/30 p-3'>
                            <p className='mb-1 text-xs text-muted-foreground'>Public Key</p>
                            <div className='flex items-center gap-2'>
                                <code className='flex-1 break-all font-mono text-xs text-foreground'>
                                    {wallet.publicKey}
                                </code>
                                <button
                                    onClick={() => copyPubkey(wallet)}
                                    className='shrink-0 text-muted-foreground hover:text-foreground'
                                >
                                    {copied === wallet.label ? (
                                        <CheckCircle size={16} className='text-green-500' />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={() => downloadKeypair(wallet)}
                            className='w-full gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                        >
                            <Download size={16} />
                            Download keypair JSON
                        </Button>
                    </GlassCard>
                ))}

                {wallets.length === 0 && (
                    <div className='py-12 text-center text-muted-foreground'>
                        <div className='mx-auto mb-3 h-8 w-48 animate-pulse rounded-lg bg-muted/30' />
                        <div className='mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted/30' />
                    </div>
                )}
            </div>

            <p className='mt-6 text-center text-xs text-muted-foreground'>
                These keypairs are deterministically derived and not secret — for demo purposes only.
            </p>
        </div>
    )
}
