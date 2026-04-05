'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    fetchBusinessesByOwner,
    fetchRevenueHistory,
    simulateRevenue,
} from '@/lib/api/oracle'
import { fetchBusinessPoolAccount, lamportsToSol } from '@/lib/solana/helpers'
import { getVaultPda } from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { DollarSign, TrendingUp, Unlock, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export function BusinessDashboard() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const program = useRevshareProgram()
    const [poolPk, setPoolPk] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [showSim, setShowSim] = useState(false)
    const [vaultLamports, setVaultLamports] = useState<number | null>(null)

    const load = useCallback(async () => {
        if (!publicKey) {
            setPoolPk(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const list = await fetchBusinessesByOwner(publicKey.toBase58())
        if (!list.length) {
            setPoolPk(null)
            setName('')
            setLoading(false)
            return
        }
        const first = list[0]!
        setPoolPk(first.pubkey)
        setName(first.name)
        setLoading(false)
    }, [publicKey])

    useEffect(() => {
        load()
    }, [load])

    const [pool, setPool] = useState<Awaited<
        ReturnType<typeof fetchBusinessPoolAccount>
    > | null>(null)
    const [chart, setChart] = useState<{ label: string; v: number }[]>([])

    const refreshPool = useCallback(async () => {
        if (!poolPk) {
            setPool(null)
            setVaultLamports(null)
            return
        }
        const pk = new PublicKey(poolPk)
        const p = await fetchBusinessPoolAccount(connection, pk)
        setPool(p)
        const [vaultPda] = getVaultPda(pk)
        const vaultInfo = await connection.getAccountInfo(vaultPda)
        setVaultLamports(vaultInfo?.lamports ?? null)
        const hist = await fetchRevenueHistory(poolPk)
        if (hist.success && hist.data?.length) {
            setChart(
                hist.data.map((r, i) => ({
                    label: `E${i + 1}`,
                    v: lamportsToSol(r.amount),
                })),
            )
        } else {
            setChart([])
        }
    }, [connection, poolPk])

    useEffect(() => {
        refreshPool()
    }, [refreshPool])

    async function onSimulate() {
        if (!poolPk) return
        setBusy(true)
        setMsg(null)
        const r = await simulateRevenue(poolPk)
        if (!r.success) setMsg(r.error || 'Simulate failed')
        else setMsg(`Epoch tx: ${r.data?.txSignature?.slice(0, 20)}…`)
        setShowSim(false)
        await refreshPool()
        setBusy(false)
    }

    async function onUnlockFirstTranche() {
        if (!program || !publicKey || !poolPk) return
        setBusy(true)
        setMsg(null)
        try {
            const businessPoolPda = new PublicKey(poolPk)
            const sig = await program.methods
                .unlockFirstTranche()
                .accounts({
                    owner: publicKey,
                    businessPool: businessPoolPda,
                })
                .rpc()
            setMsg(`First tranche unlocked: ${sig.slice(0, 16)}…`)
            await refreshPool()
        } catch (e) {
            setMsg(e instanceof Error ? e.message : 'Unlock failed')
        } finally {
            setBusy(false)
        }
    }

    async function onRelease() {
        if (!program || !publicKey || !poolPk) return
        setBusy(true)
        setMsg(null)
        try {
            const businessPoolPda = new PublicKey(poolPk)
            const [vaultPda] = getVaultPda(businessPoolPda)
            const sig = await program.methods
                .releaseFunds()
                .accounts({
                    owner: publicKey,
                    businessPool: businessPoolPda,
                    vault: vaultPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
            setMsg(`Released: ${sig.slice(0, 16)}…`)
            await refreshPool()
        } catch (e) {
            setMsg(e instanceof Error ? e.message : 'Release failed')
        } finally {
            setBusy(false)
        }
    }

    if (!publicKey) {
        return (
            <div className='container mx-auto px-4 py-16 text-center'>
                <p className='text-muted-foreground'>Connect owner wallet</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className='container mx-auto px-4 py-16 text-center'>
                Loading…
            </div>
        )
    }

    if (!poolPk) {
        return (
            <div className='container mx-auto max-w-lg px-4 py-16 text-center'>
                <p className='mb-4 text-muted-foreground'>
                    No business registered for this wallet in Oracle.
                </p>
                <Button variant='brand' asChild>
                    <Link href='/create-business'>Create business</Link>
                </Button>
            </div>
        )
    }

    const raisedSol =
        pool && !pool.tokensSold.isZero()
            ? lamportsToSol(
                  pool.tokensSold.toNumber() * pool.tokenPrice.toNumber(),
              )
            : 0
    const raiseCapSol = pool
        ? lamportsToSol(pool.raiseLimit.toNumber())
        : 0
    const fr = pool?.fundsReleased.toNumber() ?? 0
    const isOwner =
        !!pool && !!publicKey && pool.owner.equals(publicKey)
    const selloutComplete =
        !!pool &&
        !pool.totalTokens.isZero() &&
        pool.tokensSold.gte(pool.totalTokens)
    const totalRaisedLamports =
        pool && !pool.tokensSold.isZero()
            ? pool.tokensSold.toNumber() * pool.tokenPrice.toNumber()
            : 0
    const raiseCapLamports = pool ? pool.raiseLimit.toNumber() : 0
    const raiseCapReached =
        !!pool &&
        raiseCapLamports > 0 &&
        totalRaisedLamports >= raiseCapLamports
    const canSyncFirstTranche =
        !!program &&
        isOwner &&
        fr === 0 &&
        (selloutComplete || raiseCapReached)
    /** On-chain `release_funds` only allows 40 (first) or 70 (second tranche flag). */
    const releaseStagePct = fr === 40 ? 40 : fr === 70 ? 30 : 0
    const expectedReleaseLamports =
        releaseStagePct > 0
            ? Math.floor((totalRaisedLamports * releaseStagePct) / 100)
            : 0
    const vaultCoversRelease =
        vaultLamports === null ||
        expectedReleaseLamports === 0 ||
        vaultLamports >= expectedReleaseLamports
    const canRequestRelease =
        !!program &&
        isOwner &&
        (fr === 40 || fr === 70) &&
        vaultCoversRelease
    const msgLooksError =
        !!msg &&
        /fail|error|insufficient|rejected|simulation|0x|wrong|constraint/i.test(
            msg,
        )

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <h1 className='mb-2 text-4xl font-bold text-foreground'>
                        Business dashboard
                    </h1>
                    <p className='text-muted-foreground'>
                        {name} —{' '}
                        <span className='font-mono text-xs'>{poolPk}</span>
                    </p>
                </div>
                <Button
                    variant='brand'
                    size='lg'
                    disabled={busy}
                    onClick={() => setShowSim(true)}
                >
                    <Zap size={20} className='mr-2' />
                    Simulate revenue
                </Button>
            </div>

            {msg && (
                <p
                    className={
                        msgLooksError
                            ? 'mt-4 text-sm text-red-500'
                            : 'mt-4 text-sm text-muted-foreground'
                    }
                >
                    {msg}
                </p>
            )}

            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <DollarSign className='text-white' size={24} />
                        </div>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        {raisedSol.toFixed(4)} SOL
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Raised / {raiseCapSol.toFixed(4)} SOL cap
                    </p>
                </GlassCard>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        {pool?.currentEpoch.toString() ?? '—'}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Current epoch
                    </p>
                </GlassCard>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600'>
                            <Users className='text-white' size={24} />
                        </div>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        {pool?.tokensSold.toString() ?? '—'} /{' '}
                        {pool?.totalTokens.toString() ?? '—'}
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Tokens sold
                    </p>
                </GlassCard>
                <GlassCard className='p-6'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600'>
                            <Unlock className='text-white' size={24} />
                        </div>
                    </div>
                    <div className='text-3xl font-bold text-foreground'>
                        {fr}%
                    </div>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Release stage (0 → 40 after sellout, 70 after 1st revenue
                        epoch)
                    </p>
                </GlassCard>
            </div>

            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-4 text-xl font-bold'>Release tranche</h2>
                <p className='mb-4 text-sm text-muted-foreground'>
                    The program sends a slice of <strong>total raised</strong>{' '}
                    SOL from the pool vault to you. The first tranche (40% flag)
                    unlocks when primary sales are done: either{' '}
                    <strong>all tokens</strong> are minted, or the{' '}
                    <strong>raise cap</strong> is reached (no more primary buys
                    allowed). Second tranche: <strong>30%</strong> after the
                    oracle records the first revenue epoch (flag moves to 70%).
                </p>
                {!isOwner && pool ? (
                    <p className='mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200'>
                        This wallet is not the on-chain pool owner. Connect{' '}
                        <span className='font-mono text-xs'>
                            {pool.owner.toBase58()}
                        </span>{' '}
                        to release funds.
                    </p>
                ) : null}
                {isOwner && fr === 0 ? (
                    <div className='mb-4 space-y-3'>
                        <p className='rounded-xl border border-border bg-accent/30 px-4 py-3 text-sm text-foreground'>
                            {raiseCapReached && !selloutComplete ? (
                                <>
                                    Raise cap is reached (
                                    {lamportsToSol(totalRaisedLamports).toFixed(4)}{' '}
                                    / {raiseCapSol.toFixed(4)} SOL) but not every
                                    token was minted (
                                    {pool?.tokensSold.toString() ?? '—'} /{' '}
                                    {pool?.totalTokens.toString() ?? '—'}). Older
                                    programs did not set the 40% flag in this
                                    case — use &quot;Sync first tranche&quot;
                                    below (needs updated program on-chain).
                                </>
                            ) : selloutComplete ? (
                                <>
                                    All tokens are sold on-chain, but{' '}
                                    <code>fundsReleased</code> is still 0. Try
                                    &quot;Sync first tranche&quot; or refresh; if
                                    it persists, confirm program deployment.
                                </>
                            ) : (
                                <>
                                    First tranche is not unlocked yet. Primary
                                    sales: {pool?.tokensSold.toString() ?? '—'} /{' '}
                                    {pool?.totalTokens.toString() ?? '—'} tokens;{' '}
                                    cap {raiseCapSol.toFixed(4)} SOL (
                                    {raisedSol.toFixed(4)} raised). Unlock
                                    appears when mint is complete{' '}
                                    <strong>or</strong> the raise cap is hit.
                                </>
                            )}
                        </p>
                        {canSyncFirstTranche ? (
                            <Button
                                variant='outline'
                                disabled={busy}
                                onClick={() => void onUnlockFirstTranche()}
                            >
                                {busy ? '…' : 'Sync first tranche (set 40%)'}
                            </Button>
                        ) : null}
                    </div>
                ) : null}
                {isOwner && (fr === 40 || fr === 70) ? (
                    <ul className='mb-4 space-y-1 text-sm text-muted-foreground'>
                        <li>
                            This request transfers ~{' '}
                            <strong className='text-foreground'>
                                {lamportsToSol(expectedReleaseLamports).toFixed(6)}
                            </strong>{' '}
                            SOL ({releaseStagePct}% of total raised).
                        </li>
                        <li>
                            Vault balance (approx.):{' '}
                            {vaultLamports === null
                                ? '…'
                                : `${lamportsToSol(vaultLamports).toFixed(6)} SOL`}
                        </li>
                        {!vaultCoversRelease && vaultLamports !== null ? (
                            <li className='text-red-400'>
                                Vault may be too low for this transfer (needs
                                rent + payout). Investors may not have paid
                                enough in yet.
                            </li>
                        ) : null}
                    </ul>
                ) : null}
                <Button
                    variant='brand'
                    disabled={busy || !canRequestRelease}
                    onClick={onRelease}
                >
                    {busy ? '…' : 'Request release'}
                </Button>
                {isOwner && fr !== 0 && fr !== 40 && fr !== 70 ? (
                    <p className='mt-2 text-xs text-muted-foreground'>
                        Release stage is {fr}. This deployment expects 40 (first
                        tranche) or 70 (second tranche) to withdraw.
                    </p>
                ) : null}
            </GlassCard>

            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Revenue epochs
                </h2>
                <div className='h-80 w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart data={chart}>
                            <CartesianGrid strokeDasharray='3 3' opacity={0.1} />
                            <XAxis dataKey='label' />
                            <YAxis tickFormatter={(v) => `${v} SOL`} />
                            <Tooltip />
                            <Line
                                type='monotone'
                                dataKey='v'
                                stroke='#8B5CF6'
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {showSim && (
                <div
                    className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-lg'
                    onClick={() => setShowSim(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GlassCard className='max-w-md p-8'>
                            <h2 className='mb-4 text-xl font-bold'>
                                Simulate month
                            </h2>
                            <p className='mb-4 text-sm text-muted-foreground'>
                                POST revenue simulate on the API.
                            </p>
                            <Input readOnly value={name} className='mb-4' />
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowSim(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1'
                                    disabled={busy}
                                    onClick={onSimulate}
                                >
                                    Run
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    )
}
