'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { fetchBusinesses } from '@/lib/api/oracle'
import {
    fetchBusinessPoolAccount,
    fetchHolderClaimAccount,
    fetchRevenueEpochAccount,
    lamportsToSol,
} from '@/lib/solana/helpers'
import {
    getHolderClaimPda,
    getRevenueEpochPda,
    getVaultPda,
} from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { ArrowRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

type Position = {
    pubkey: string
    name: string
    tokens: string
    claimableLamports?: number
    canClaim: boolean
}

export default function InvestorDashboard() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const program = useRevshareProgram()
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!publicKey) {
            setPositions([])
            setLoading(false)
            return
        }
        setLoading(true)
        const res = await fetchBusinesses()
        const out: Position[] = []
        if (res.success && res.data) {
            for (const b of res.data) {
                const poolPk = new PublicKey(b.pubkey)
                const [claimPk] = getHolderClaimPda(poolPk, publicKey)
                const claim = await fetchHolderClaimAccount(connection, claimPk)
                if (!claim || claim.tokenHeld.isZero()) continue
                const pool = await fetchBusinessPoolAccount(connection, poolPk)
                const canClaim =
                    !!pool &&
                    claim.lastClaimedEpoch.toNumber() <
                        pool.currentEpoch.toNumber()
                let claimable: number | undefined
                if (canClaim) {
                    const [epochPk] = getRevenueEpochPda(
                        poolPk,
                        claim.lastClaimedEpoch.toNumber(),
                    )
                    try {
                        const epoch = await fetchRevenueEpochAccount(
                            connection,
                            epochPk,
                        )
                        if (epoch) {
                            const share = epoch.distributedAmount
                                .mul(claim.tokenHeld)
                                .div(pool!.totalTokens)
                            claimable = share.toNumber()
                        }
                    } catch {
                        claimable = undefined
                    }
                }
                out.push({
                    pubkey: b.pubkey,
                    name: b.name,
                    tokens: claim.tokenHeld.toString(),
                    claimableLamports: claimable,
                    canClaim,
                })
            }
        }
        setPositions(out)
        setLoading(false)
    }, [connection, publicKey])

    useEffect(() => {
        load()
    }, [load])

    async function claimOne(poolPkStr: string) {
        if (!program || !publicKey) return
        setBusy(true)
        setMsg(null)
        try {
            const businessPoolPda = new PublicKey(poolPkStr)
            const [holderClaimPda] = getHolderClaimPda(
                businessPoolPda,
                publicKey,
            )
            const claim = await fetchHolderClaimAccount(
                connection,
                holderClaimPda,
            )
            if (!claim) throw new Error('No claim account')
            const epoch = claim.lastClaimedEpoch.toNumber()
            const [revenueEpochPda] = getRevenueEpochPda(businessPoolPda, epoch)
            const [vaultPda] = getVaultPda(businessPoolPda)
            const sig = await program.methods
                .claim()
                .accounts({
                    investor: publicKey,
                    businessPool: businessPoolPda,
                    holderClaim: holderClaimPda,
                    revenueEpoch: revenueEpochPda,
                    vault: vaultPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            setMsg(`Claim ok: ${sig.slice(0, 16)}…`)
            await load()
        } catch (e) {
            setMsg(e instanceof Error ? e.message : 'Claim failed')
        } finally {
            setBusy(false)
        }
    }

    if (!publicKey) {
        return (
            <div className='container mx-auto px-4 py-16 text-center'>
                <Wallet className='mx-auto mb-4 text-muted-foreground' size={48} />
                <p className='text-muted-foreground'>
                    Connect wallet to see positions
                </p>
            </div>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='mb-8'>
                <h1 className='mb-2 text-4xl font-bold text-foreground'>
                    Investor dashboard
                </h1>
                <p className='text-muted-foreground'>Holder claims vs API list</p>
            </div>

            {msg && (
                <p className='mb-4 text-sm text-muted-foreground'>{msg}</p>
            )}

            <GlassCard className='p-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <h2 className='text-2xl font-bold text-foreground'>
                        My positions
                    </h2>
                    <Button variant='outline' size='sm' asChild>
                        <Link href='/'>
                            Browse
                            <ArrowRight size={16} className='ml-2' />
                        </Link>
                    </Button>
                </div>
                {loading ? (
                    <p className='text-muted-foreground'>Loading…</p>
                ) : positions.length === 0 ? (
                    <p className='text-muted-foreground'>
                        No token holdings found across known businesses.
                    </p>
                ) : (
                    <ul className='space-y-4'>
                        {positions.map((p) => (
                            <li
                                key={p.pubkey}
                                className='flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4'
                            >
                                <div>
                                    <Link
                                        href={`/business/${p.pubkey}`}
                                        className='font-semibold text-primary hover:underline'
                                    >
                                        {p.name}
                                    </Link>
                                    <p className='text-sm text-muted-foreground'>
                                        Tokens: {p.tokens}
                                    </p>
                                    {p.claimableLamports != null && (
                                        <p className='text-sm text-green-500'>
                                            Claimable ~{' '}
                                            {lamportsToSol(
                                                p.claimableLamports,
                                            ).toFixed(6)}{' '}
                                            SOL
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant='brand'
                                    size='sm'
                                    disabled={
                                        busy || !program || !p.canClaim
                                    }
                                    onClick={() => claimOne(p.pubkey)}
                                >
                                    Claim
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </GlassCard>
        </div>
    )
}
