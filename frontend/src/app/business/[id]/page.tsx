'use client'

import { GlassCard } from '@/components/GlassCard'
import { BusinessDetailPageSkeleton } from '@/components/skeletons/DataLoadingSkeletons'
import { PurchaseSuccessModal } from '@/components/PurchaseSuccessModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    fetchBusiness,
    fetchListingsForBusiness,
    fetchRevenueHistory,
    simulateRevenue,
} from '@/lib/api/oracle'
import type { TokenListingDto } from '@/lib/api/types'
import { profileToBusiness } from '@/lib/businessView'
import type { Business } from '@/lib/data'
import {
    fetchBusinessPoolAccount,
    fetchTokenListingAccount,
    findEscrowTokenAccountForListing,
    lamportsToSol,
    setStoredInvestorTokenAccount,
} from '@/lib/solana/helpers'
import {
    getHolderClaimPda,
    getTokenMintPda,
    getFundsVaultPda,
} from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { BN } from '@coral-xyz/anchor'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { getSolanaExplorerTxUrl, isLocalnet } from '@/lib/env'
import { ArrowLeft, ExternalLink, Shield, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export default function BusinessDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const pubkeyStr = params.id as string
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const program = useRevshareProgram()

    const [activeTab, setActiveTab] = useState('overview')
    const [tokenAmount, setTokenAmount] = useState(1)
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [business, setBusiness] = useState<Business | null>(null)
    const [listings, setListings] = useState<TokenListingDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [txBusy, setTxBusy] = useState(false)
    const [simBusy, setSimBusy] = useState(false)
    const [simMsg, setSimMsg] = useState<{ text: string; sig?: string } | null>(null)
    const [purchaseDone, setPurchaseDone] = useState<{
        signature: string
        tokens: number
        totalSol: number
        businessName: string
        variantLabel: string
    } | null>(null)
    const [poolPk] = useState(() => new PublicKey(pubkeyStr))
    const loadGenRef = useRef(0)

    const load = useCallback(async () => {
        const gen = ++loadGenRef.current
        setLoading(true)
        setError(null)
        const res = await fetchBusiness(pubkeyStr)
        if (gen !== loadGenRef.current) return
        if (!res.success || !res.data) {
            setError(res.error || 'Business not found')
            setBusiness(null)
            setLoading(false)
            return
        }
        const [poolA, poolB, hist, ml] = await Promise.all([
            fetchBusinessPoolAccount(connection, poolPk),
            fetchBusinessPoolAccount(connection, poolPk),
            fetchRevenueHistory(pubkeyStr),
            fetchListingsForBusiness(pubkeyStr),
        ])
        if (gen !== loadGenRef.current) return
        let pool = poolA
        if (poolA && poolB) {
            pool = poolB.tokensSold.gte(poolA.tokensSold) ? poolB : poolA
        } else {
            pool = poolB ?? poolA
        }
        const rev = hist.success && hist.data ? hist.data : undefined
        setBusiness(profileToBusiness(res.data, pool, rev))
        if (ml.success && ml.data) {
            setListings(ml.data.filter((l) => l.status === 0))
        } else {
            setListings([])
        }
        setLoading(false)
    }, [connection, poolPk, pubkeyStr])

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        if (!business || business.totalTokens <= 0) return
        const max = Math.max(1, business.tokensLeft)
        setTokenAmount((prev) => Math.min(prev, max))
    }, [business?.tokensLeft, business?.totalTokens])

    if (loading) {
        return <BusinessDetailPageSkeleton />
    }

    if (error || !business) {
        return (
            <div className='container mx-auto px-4 py-16 text-center'>
                <p className='text-xl text-muted-foreground'>
                    {error || 'Business not found'}
                </p>
                <Button onClick={() => router.push('/')} className='mt-4'>
                    Back home
                </Button>
            </div>
        )
    }

    const poolData = business.totalTokens > 0

    const chartData = business.monthlyRevenue.map((revenue, index) => ({
        month: `E${index + 1}`,
        revenue,
    }))

    const maxBuy = Math.max(1, business.tokensLeft || 1)
    const amountClamped = Math.min(tokenAmount, maxBuy)
    const totalCostSol =
        poolData && business.tokenPrice > 0
            ? amountClamped * business.tokenPrice
            : 0
    const estMonthlySol =
        poolData && business.totalTokens > 0
            ? (business.targetRevenue *
                  (business.revenueSharePercent / 100) *
                  amountClamped) /
              business.totalTokens /
              12
            : 0

    async function handleSimulate() {
        setSimBusy(true)
        setSimMsg(null)
        try {
            const res = await simulateRevenue(pubkeyStr)
            if (res.success && res.data) {
                setSimMsg({ text: `Revenue distributed: epoch ${res.data.epoch}`, sig: res.data.txSignature ?? undefined })
            } else {
                setSimMsg({ text: res.error ?? 'Simulation failed' })
            }
            await load()
        } catch {
            setSimMsg({ text: 'Simulation failed' })
        } finally {
            setSimBusy(false)
        }
    }

    async function executeBuy() {
        if (!program || !publicKey || !poolData) return
        setTxBusy(true)
        try {
            const businessPoolPda = poolPk
            const poolAcc = await fetchBusinessPoolAccount(
                connection,
                businessPoolPda,
            )
            if (!poolAcc) throw new Error('Pool account missing')
            const [tokenMintPda] = getTokenMintPda(businessPoolPda)
            const [fundsVaultPda] = getFundsVaultPda(businessPoolPda)
            const [holderClaimPda] = getHolderClaimPda(
                businessPoolPda,
                publicKey,
            )
            const investorTokenAccount = await getAssociatedTokenAddress(
                tokenMintPda,
                publicKey,
            )
            const sig = await program.methods
                .buyTokens(new BN(amountClamped))
                .accounts({
                    investor: publicKey,
                    businessPool: businessPoolPda,
                    tokenMint: tokenMintPda,
                    holderClaim: holderClaimPda,
                    investorTokenAccount,
                    fundsVault: fundsVaultPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc()
            setStoredInvestorTokenAccount(
                businessPoolPda.toBase58(),
                investorTokenAccount.toBase58(),
            )
            setShowBuyModal(false)
            setPurchaseDone({
                signature: sig,
                tokens: amountClamped,
                totalSol: totalCostSol,
                businessName: business?.name ?? 'Business',
                variantLabel: 'Primary pool',
            })
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Transaction failed')
        } finally {
            setTxBusy(false)
        }
    }

    async function buyListing(row: TokenListingDto) {
        if (!program || !publicKey) return
        setTxBusy(true)
        try {
            const businessPoolPda = new PublicKey(row.businessPubkey)
            const poolAcc = await fetchBusinessPoolAccount(
                connection,
                businessPoolPda,
            )
            if (!poolAcc) throw new Error('Pool not found')
            const [tokenMintPda] = getTokenMintPda(businessPoolPda)
            const listingPda = new PublicKey(row.listingPubkey)
            const onChainListing = await fetchTokenListingAccount(
                connection,
                listingPda,
            )
            if (!onChainListing) throw new Error('Listing account missing')
            const seller = onChainListing.seller
            const escrow = await findEscrowTokenAccountForListing(
                connection,
                listingPda,
                tokenMintPda,
            )
            if (!escrow) throw new Error('Escrow token account not found')
            const [buyerClaimPda] = getHolderClaimPda(
                businessPoolPda,
                publicKey,
            )
            const buyerTokenAccount = await getAssociatedTokenAddress(
                tokenMintPda,
                publicKey,
            )
            const totalLamports = onChainListing.amount.mul(
                onChainListing.pricePerToken,
            )
            const totalSolPaid = lamportsToSol(totalLamports.toNumber())
            const sig = await program.methods
                .buyListedTokens()
                .accounts({
                    buyer: publicKey,
                    businessPool: businessPoolPda,
                    tokenMint: tokenMintPda,
                    tokenListing: listingPda,
                    seller,
                    escrowTokenAccount: escrow,
                    buyerClaim: buyerClaimPda,
                    buyerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc()
            setStoredInvestorTokenAccount(
                businessPoolPda.toBase58(),
                buyerTokenAccount.toBase58(),
            )
            setPurchaseDone({
                signature: sig,
                tokens: onChainListing.amount.toNumber(),
                totalSol: totalSolPaid,
                businessName: business?.name ?? 'Business',
                variantLabel: 'Marketplace listing',
            })
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Buy failed')
        } finally {
            setTxBusy(false)
        }
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <button
                onClick={() => router.push('/')}
                className='flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <GlassCard className='mt-8 p-8'>
                <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
                    <div>
                        <div className='mb-6 flex items-center gap-4'>
                            <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-foreground'>
                                {business.logo || '·'}
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-foreground'>
                                    {business.name}
                                </h1>
                                <p className='text-muted-foreground'>
                                    {business.category || '—'}
                                </p>
                            </div>
                        </div>

                        <p className='mb-6 text-lg text-foreground/80'>
                            {business.description}
                        </p>

                        <div className='mb-6 grid grid-cols-2 gap-4'>
                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent'>
                                    {business.apy}%
                                    <TrendingUp
                                        size={24}
                                        className='text-green-500'
                                    />
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Est. APY
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 text-2xl font-bold text-foreground'>
                                    {business.revenueSharePercent}%
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Revenue share
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='mb-1 text-2xl font-bold text-foreground'>
                                    {business.tokenPrice > 0
                                        ? `${business.tokenPrice} SOL`
                                        : '—'}
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Token price
                                </p>
                            </div>

                            <div className='rounded-2xl border border-border bg-accent/5 p-4'>
                                <div
                                    className={`mb-1 text-2xl font-bold ${
                                        business.riskLevel === 'Low'
                                            ? 'text-green-500'
                                            : business.riskLevel === 'Medium'
                                              ? 'text-yellow-500'
                                              : 'text-red-500'
                                    }`}
                                >
                                    {business.riskLevel}
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Risk
                                </p>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <div className='mb-2 flex justify-between text-sm text-muted-foreground'>
                                    <span>Funding</span>
                                    <span>{business.fundingProgress}%</span>
                                </div>
                                <div className='h-3 overflow-hidden rounded-full bg-accent/20'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-500'
                                        style={{
                                            width: `${business.fundingProgress}%`,
                                        }}
                                    />
                                </div>
                                <p className='mt-2 text-sm text-muted-foreground/60'>
                                    {business.tokensLeft.toLocaleString()} /{' '}
                                    {business.totalTokens.toLocaleString()}{' '}
                                    tokens left
                                </p>
                            </div>

                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <Shield size={16} />
                                <span>Owner: {business.owner}</span>
                            </div>
                        </div>
                    </div>

                    <GlassCard variant='bordered' className='h-fit p-6'>
                        <h2 className='mb-6 text-xl font-bold text-foreground'>
                            Purchase tokens
                        </h2>

                        <div className='space-y-6'>
                            <div>
                                <label className='mb-2 block text-sm font-medium text-muted-foreground'>
                                    Amount
                                </label>
                                <Input
                                    type='number'
                                    value={tokenAmount}
                                    onChange={(e) =>
                                        setTokenAmount(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            ),
                                        )
                                    }
                                    min={1}
                                    max={maxBuy}
                                />
                                <input
                                    type='range'
                                    value={Math.min(amountClamped, maxBuy)}
                                    onChange={(e) =>
                                        setTokenAmount(
                                            parseInt(e.target.value, 10),
                                        )
                                    }
                                    min={1}
                                    max={maxBuy}
                                    className='mt-3 w-full accent-primary'
                                />
                            </div>

                            <div className='space-y-3 rounded-2xl border border-border bg-accent/5 p-4'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Total (SOL)
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {totalCostSol.toFixed(6)}
                                    </span>
                                </div>
                                <div className='border-t border-border pt-3'>
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>
                                            Est. monthly (rough)
                                        </span>
                                        <span className='font-bold text-green-500'>
                                            {estMonthlySol.toFixed(6)} SOL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant='brand'
                                size='lg'
                                className='w-full'
                                disabled={
                                    !program ||
                                    !publicKey ||
                                    !poolData ||
                                    txBusy
                                }
                                onClick={() => setShowBuyModal(true)}
                            >
                                Buy on-chain
                            </Button>

                            {!publicKey && (
                                <p className='text-center text-xs text-muted-foreground'>
                                    Connect wallet to buy
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </GlassCard>

            <div className='mt-8 flex gap-4 border-b border-border'>
                {['overview', 'revenue', 'marketplace'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-6 py-3 font-medium transition-colors ${
                            activeTab === tab
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-600' />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <GlassCard className='p-8'>
                    <h2 className='mb-6 text-2xl font-bold text-foreground'>Overview</h2>
                    <p className='mb-8 text-muted-foreground'>{business.description}</p>

                    {/* Tranche progress */}
                    {poolData && (
                        <div>
                            <h3 className='mb-4 font-semibold text-foreground'>Funds release schedule</h3>
                            <div className='space-y-3'>
                                {[
                                    { pct: 50, label: '50% — at listing (initial)', condition: 'Immediately on pool creation' },
                                    { pct: 70, label: '70% — after first revenue epoch', condition: 'First revenue distribution received' },
                                    { pct: 100, label: '100% — after 4 epochs at target', condition: 'Avg monthly revenue ≥ target for 4 epochs' },
                                ].map(({ pct, label, condition }) => {
                                    const unlocked = business.fundsReleased >= pct
                                    return (
                                        <div key={pct} className={`rounded-xl border p-4 ${unlocked ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-accent/5'}`}>
                                            <div className='flex items-center justify-between'>
                                                <span className={`font-medium ${unlocked ? 'text-green-400' : 'text-muted-foreground'}`}>{label}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${unlocked ? 'bg-green-500/20 text-green-400' : 'bg-muted/40 text-muted-foreground'}`}>
                                                    {unlocked ? '✓ Unlocked' : 'Locked'}
                                                </span>
                                            </div>
                                            <p className='mt-1 text-xs text-muted-foreground'>{condition}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='mt-4'>
                                <div className='mb-1 flex justify-between text-xs text-muted-foreground'>
                                    <span>Current release</span>
                                    <span>{business.fundsReleased}%</span>
                                </div>
                                <div className='h-2 overflow-hidden rounded-full bg-accent/20'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500'
                                        style={{ width: `${business.fundsReleased}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            {activeTab === 'revenue' && (
                <GlassCard className='p-8'>
                    <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
                        <h2 className='text-2xl font-bold text-foreground'>Revenue history</h2>
                        {isLocalnet() && (
                            <div className='flex items-center gap-3'>
                                {simMsg && (
                                    <span className={`flex items-center gap-2 text-sm ${simMsg.sig ? 'text-green-400' : 'text-red-400'}`}>
                                        {simMsg.text}
                                        {simMsg.sig && (
                                            <a href={getSolanaExplorerTxUrl(simMsg.sig)} target='_blank' rel='noreferrer' className='hover:opacity-100 opacity-70'>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </span>
                                )}
                                <Button
                                    size='sm'
                                    disabled={simBusy}
                                    onClick={handleSimulate}
                                    className='gap-1.5 border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                                >
                                    <Zap size={14} />
                                    {simBusy ? 'Simulating…' : 'Simulate revenue'}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className='h-80 w-full'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='currentColor'
                                    className='text-border'
                                    opacity={0.1}
                                />
                                <XAxis dataKey='month' />
                                <YAxis tickFormatter={(v) => `${v} SOL`} />
                                <Tooltip />
                                <Line
                                    type='monotone'
                                    dataKey='revenue'
                                    stroke='#8B5CF6'
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'marketplace' && (
                <GlassCard className='p-8'>
                    <h2 className='mb-6 text-2xl font-bold text-foreground'>
                        Listings for this business
                    </h2>
                    {listings.length === 0 ? (
                        <p className='text-muted-foreground'>
                            No active listings. See{' '}
                            <Link href='/marketplace' className='text-primary'>
                                global marketplace
                            </Link>
                            .
                        </p>
                    ) : (
                        <ul className='space-y-4'>
                            {listings.map((l) => (
                                <li
                                    key={l.id}
                                    className='flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4'
                                >
                                    <div>
                                        <p className='font-mono text-sm text-muted-foreground'>
                                            {l.sellerPubkey.slice(0, 8)}…
                                        </p>
                                        <p className='text-foreground'>
                                            {l.amount} tokens @{' '}
                                            {lamportsToSol(l.pricePerToken)} SOL
                                        </p>
                                    </div>
                                    <Button
                                        variant='brand'
                                        size='sm'
                                        disabled={
                                            !program || !publicKey || txBusy
                                        }
                                        onClick={() => buyListing(l)}
                                    >
                                        Buy
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </GlassCard>
            )}

            <PurchaseSuccessModal
                open={!!purchaseDone}
                onClose={() => setPurchaseDone(null)}
                businessName={purchaseDone?.businessName ?? ''}
                tokens={purchaseDone?.tokens ?? 0}
                totalSol={purchaseDone?.totalSol ?? 0}
                signature={purchaseDone?.signature ?? ''}
                variantLabel={purchaseDone?.variantLabel}
            />

            {showBuyModal && (
                <div
                    className='m-0! fixed bottom-0 left-0 right-0 top-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-lg duration-300 animate-in fade-in'
                    onClick={() => setShowBuyModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-md'
                    >
                        <GlassCard className='p-8'>
                            <h2 className='mb-4 text-2xl font-bold text-foreground'>
                                Confirm purchase
                            </h2>
                            <div className='mb-6 space-y-4'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Tokens
                                    </span>
                                    <span>{amountClamped}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        Total SOL
                                    </span>
                                    <span>{totalCostSol.toFixed(6)}</span>
                                </div>
                            </div>
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowBuyModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1'
                                    disabled={txBusy}
                                    onClick={() => executeBuy()}
                                >
                                    {txBusy ? 'Signing…' : 'Confirm'}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    )
}
