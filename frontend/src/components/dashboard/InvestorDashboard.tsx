'use client'

import { GlassCard } from '@/components/GlassCard'
import { InvestorPositionsSkeleton } from '@/components/skeletons/DataLoadingSkeletons'
import { Button } from '@/components/ui/button'
import { profileToBusiness } from '@/lib/businessView'
import type { Business } from '@/lib/data'
import { fetchBusinesses } from '@/lib/api/oracle'
import type { BusinessProfile } from '@/lib/api/types'
import {
    fetchBusinessPoolAccount,
    fetchHolderClaimAccount,
    fetchRevenueEpochAccount,
    lamportsToSol,
} from '@/lib/solana/helpers'
import {
    getHolderClaimPda,
    getRevenueEpochPda,
    getFundsVaultPda,
} from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ArrowRight, MapPin, Wallet } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

type Position = Business & {
    heldTokens: string
    claimableLamports?: number
    canClaim: boolean
}

export function InvestorDashboard() {
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
        let out: Position[] = []
        if (res.success && res.data) {
            const list = res.data as BusinessProfile[]
            const rows: (Position | null)[] = await Promise.all(
                list.map(async (b) => {
                    const poolPk = new PublicKey(b.pubkey)
                    const [claimPk] = getHolderClaimPda(poolPk, publicKey)
                    const claim = await fetchHolderClaimAccount(
                        connection,
                        claimPk,
                    )
                    if (!claim || claim.tokenHeld.isZero()) return null
                    const pool = await fetchBusinessPoolAccount(
                        connection,
                        poolPk,
                    )
                    const view = profileToBusiness(b, pool)
                    const canClaim =
                        !!pool &&
                        claim.lastClaimedEpoch.toNumber() <
                            pool.currentEpoch.toNumber()
                    let claimable: number | undefined
                    if (canClaim && pool) {
                        const [epochPk] = getRevenueEpochPda(
                            poolPk,
                            claim.lastClaimedEpoch.toNumber(),
                        )
                        try {
                            const epoch = await fetchRevenueEpochAccount(
                                connection,
                                epochPk,
                            )
                            if (epoch && !pool.totalTokens.isZero()) {
                                const share = epoch.distributedAmount
                                    .mul(claim.tokenHeld)
                                    .div(pool.totalTokens)
                                claimable = share.toNumber()
                            }
                        } catch {
                            claimable = undefined
                        }
                    }
                    return {
                        ...view,
                        heldTokens: claim.tokenHeld.toString(),
                        claimableLamports: claimable,
                        canClaim,
                    }
                }),
            )
            out = rows.flatMap((x) => (x ? [x] : []))
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
            const [fundsVaultPda] = getFundsVaultPda(businessPoolPda)
            const sig = await program.methods
                .claim()
                .accounts({
                    investor: publicKey,
                    businessPool: businessPoolPda,
                    holderClaim: holderClaimPda,
                    revenueEpoch: revenueEpochPda,
                    fundsVault: fundsVaultPda,
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
                <p className='text-muted-foreground'>
                    Your token stakes and revenue claims per business
                </p>
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
                        <Link href='/marketplace'>
                            Browse
                            <ArrowRight size={16} className='ml-2' />
                        </Link>
                    </Button>
                </div>
                {loading ? (
                    <InvestorPositionsSkeleton />
                ) : positions.length === 0 ? (
                    <p className='text-muted-foreground'>
                        No token holdings found across known businesses.
                    </p>
                ) : (
                    <ul className='space-y-6'>
                        {positions.map((p) => (
                            <li
                                key={p.pubkey}
                                className='rounded-2xl border border-border p-5 transition-colors hover:border-primary/25'
                            >
                                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                    <div className='flex min-w-0 flex-1 gap-4'>
                                        <div
                                            className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-accent/40 bg-cover bg-center text-lg font-bold text-foreground'
                                            style={
                                                /^https?:\/\//i.test(p.logo)
                                                    ? {
                                                          backgroundImage: `url(${p.logo})`,
                                                      }
                                                    : undefined
                                            }
                                            role='img'
                                            aria-label={p.name}
                                        >
                                            {!/^https?:\/\//i.test(p.logo) &&
                                                (p.logo || '?')}
                                        </div>
                                        <div className='min-w-0 flex-1'>
                                            <Link
                                                href={`/business/${p.pubkey}`}
                                                className='text-lg font-semibold text-primary hover:underline'
                                            >
                                                {p.name}
                                            </Link>
                                            {p.category ? (
                                                <p className='mt-0.5 flex items-center gap-1 text-sm text-muted-foreground'>
                                                    <MapPin
                                                        size={14}
                                                        className='shrink-0 opacity-70'
                                                    />
                                                    {p.category}
                                                </p>
                                            ) : null}
                                            {p.description ? (
                                                <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>
                                                    {p.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className='flex shrink-0 flex-col items-stretch gap-2 sm:items-end'>
                                        <span
                                            className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                p.riskLevel === 'High'
                                                    ? 'bg-red-500/15 text-red-400'
                                                    : p.riskLevel === 'Low'
                                                      ? 'bg-emerald-500/15 text-emerald-400'
                                                      : 'bg-amber-500/15 text-amber-400'
                                            }`}
                                        >
                                            {p.riskLevel} risk
                                        </span>
                                        <Button
                                            variant='brand'
                                            size='sm'
                                            className='w-full sm:w-auto'
                                            disabled={
                                                busy || !program || !p.canClaim
                                            }
                                            onClick={() => claimOne(p.pubkey)}
                                        >
                                            Claim
                                        </Button>
                                    </div>
                                </div>

                                <div className='mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 md:grid-cols-4'>
                                    <div>
                                        <p className='text-xs text-muted-foreground'>
                                            Your tokens
                                        </p>
                                        <p className='font-mono text-sm font-semibold text-foreground'>
                                            {Number(
                                                p.heldTokens,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className='text-xs text-muted-foreground'>
                                            Pool price
                                        </p>
                                        <p className='font-mono text-sm font-semibold text-foreground'>
                                            {p.tokenPrice > 0
                                                ? `${p.tokenPrice} SOL`
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className='text-xs text-muted-foreground'>
                                            Revenue share
                                        </p>
                                        <p className='text-sm font-semibold text-foreground'>
                                            {p.revenueSharePercent > 0
                                                ? `${p.revenueSharePercent}%`
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className='text-xs text-muted-foreground'>
                                            Target revenue
                                        </p>
                                        <p className='text-sm font-semibold text-foreground'>
                                            {p.targetRevenue > 0
                                                ? `${p.targetRevenue} SOL`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className='mt-4'>
                                    <div className='mb-1 flex justify-between text-xs text-muted-foreground'>
                                        <span>Pool funding</span>
                                        <span>
                                            {p.tokensLeft.toLocaleString()} left
                                            of {p.totalTokens.toLocaleString()}{' '}
                                            tokens
                                        </span>
                                    </div>
                                    <div className='h-2 overflow-hidden rounded-full bg-accent'>
                                        <div
                                            className='h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all'
                                            style={{
                                                width: `${Math.min(100, p.fundingProgress)}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {p.claimableLamports != null && (
                                    <p className='mt-3 text-sm text-green-500'>
                                        Claimable ~{' '}
                                        {lamportsToSol(
                                            p.claimableLamports,
                                        ).toFixed(6)}{' '}
                                        SOL (this epoch estimate)
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </GlassCard>
        </div>
    )
}
