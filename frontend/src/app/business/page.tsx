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

export default function BusinessDashboard() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const program = useRevshareProgram()
    const [poolPk, setPoolPk] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [showSim, setShowSim] = useState(false)

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
            return
        }
        const pk = new PublicKey(poolPk)
        const p = await fetchBusinessPoolAccount(connection, pk)
        setPool(p)
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
                <p className='mt-4 text-sm text-muted-foreground'>{msg}</p>
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
                        Funds released flag
                    </p>
                </GlassCard>
            </div>

            <GlassCard className='mt-8 p-8'>
                <h2 className='mb-4 text-xl font-bold'>Release tranche</h2>
                <p className='mb-4 text-sm text-muted-foreground'>
                    Tranche unlock per program rules.
                </p>
                <Button
                    variant='brand'
                    disabled={busy || !program || fr === 0}
                    onClick={onRelease}
                >
                    Request release
                </Button>
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
