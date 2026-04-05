'use client'

import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchBusiness, fetchMarketplaceListings } from '@/lib/api/oracle'
import type { TokenListingDto } from '@/lib/api/types'
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
} from '@/lib/solana/pda'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import { Plus, Search, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

type Row = TokenListingDto & { businessName?: string }

export default function MarketplacePage() {
    const { publicKey } = useWallet()
    const program = useRevshareProgram()
    const [searchQuery, setSearchQuery] = useState('')
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [showBuy, setShowBuy] = useState<Row | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await fetchMarketplaceListings()
        if (!res.success) {
            setErr(res.error || 'Request failed')
            setRows([])
            setLoading(false)
            return
        }
        const active = (res.data ?? []).filter((l) => l.status === 0)
        const enriched: Row[] = []
        for (const l of active) {
            const b = await fetchBusiness(l.businessPubkey)
            enriched.push({
                ...l,
                businessName: b.success && b.data ? b.data.name : undefined,
            })
        }
        setRows(enriched)
        setLoading(false)
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const filtered = rows.filter((r) =>
        (r.businessName || r.businessPubkey)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
    )

    async function buyListed(row: Row) {
        if (!program || !publicKey) return
        setBusy(true)
        setErr(null)
        try {
            const businessPoolPda = new PublicKey(row.businessPubkey)
            const poolAcc = await fetchBusinessPoolAccount(
                program.provider.connection,
                businessPoolPda,
            )
            if (!poolAcc) throw new Error('Pool missing')
            const [tokenMintPda] = getTokenMintPda(businessPoolPda)
            const listingPda = new PublicKey(row.listingPubkey)
            const listing = await fetchTokenListingAccount(
                program.provider.connection,
                listingPda,
            )
            if (!listing) throw new Error('Listing missing')
            const seller = listing.seller
            const escrow = await findEscrowTokenAccountForListing(
                program.provider.connection,
                listingPda,
                tokenMintPda,
            )
            if (!escrow) throw new Error('Escrow not found')
            const [buyerClaimPda] = getHolderClaimPda(
                businessPoolPda,
                publicKey,
            )
            const buyerTokenKp = Keypair.generate()
            await program.methods
                .buyListedTokens()
                .accounts({
                    buyer: publicKey,
                    businessPool: businessPoolPda,
                    tokenMint: tokenMintPda,
                    tokenListing: listingPda,
                    seller,
                    escrowTokenAccount: escrow,
                    buyerClaim: buyerClaimPda,
                    buyerTokenAccount: buyerTokenKp.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([buyerTokenKp])
                .rpc()
            setStoredInvestorTokenAccount(
                businessPoolPda.toBase58(),
                buyerTokenKp.publicKey.toBase58(),
            )
            setShowBuy(null)
            await load()
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Buy failed')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <h1 className='mb-2 text-4xl font-bold text-foreground'>
                        Token marketplace
                    </h1>
                    <p className='text-muted-foreground'>
                        Listings from API, settlement on-chain
                    </p>
                </div>
                <Button variant='brand' size='lg' asChild>
                    <Link href='/'>
                        <Plus size={20} className='mr-2' />
                        Buy from catalog
                    </Link>
                </Button>
            </div>

            {err && (
                <p className='mb-4 text-sm text-red-500'>{err}</p>
            )}

            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600'>
                            <ShoppingCart className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {loading ? '…' : filtered.length}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Active listings
                            </p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className='p-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600'>
                            <TrendingUp className='text-white' size={24} />
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-foreground'>
                                {loading
                                    ? '…'
                                    : rows.reduce((s, r) => s + r.amount, 0)}
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Tokens listed (sum)
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className='mt-8 p-6'>
                <div className='relative'>
                    <Search
                        className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
                        size={20}
                    />
                    <Input
                        type='text'
                        placeholder='Search…'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-12'
                    />
                </div>
            </GlassCard>

            <GlassCard className='mt-8 overflow-hidden p-8'>
                <h2 className='mb-6 text-2xl font-bold text-foreground'>
                    Listings
                </h2>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b border-border'>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Business
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Seller
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Price / token
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Tokens
                                </th>
                                <th className='px-4 py-4 text-left text-sm font-medium text-muted-foreground'>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((listing) => (
                                <tr
                                    key={listing.id}
                                    className='border-b border-border/50 transition-colors hover:bg-accent/5'
                                >
                                    <td className='px-4 py-4 font-semibold text-foreground'>
                                        {listing.businessName ||
                                            listing.businessPubkey.slice(
                                                0,
                                                8,
                                            ) + '…'}
                                    </td>
                                    <td className='px-4 py-4 font-mono text-sm text-muted-foreground'>
                                        {listing.sellerPubkey.slice(0, 8)}…
                                    </td>
                                    <td className='px-4 py-4'>
                                        {lamportsToSol(
                                            listing.pricePerToken,
                                        ).toFixed(6)}{' '}
                                        SOL
                                    </td>
                                    <td className='px-4 py-4 text-muted-foreground'>
                                        {listing.amount}
                                    </td>
                                    <td className='px-4 py-4'>
                                        <Button
                                            variant='brand'
                                            size='sm'
                                            disabled={
                                                !program ||
                                                !publicKey ||
                                                busy
                                            }
                                            onClick={() =>
                                                setShowBuy(listing)
                                            }
                                        >
                                            Buy
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length === 0 && (
                    <div className='py-16 text-center text-muted-foreground'>
                        No listings
                    </div>
                )}
            </GlassCard>

            {showBuy && (
                <div
                    className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-lg'
                    onClick={() => setShowBuy(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GlassCard className='max-w-md p-8'>
                            <h2 className='mb-4 text-xl font-bold'>
                                Confirm purchase
                            </h2>
                            <p className='mb-4 text-sm text-muted-foreground'>
                                Total ~{' '}
                                {(
                                    showBuy.amount *
                                    lamportsToSol(showBuy.pricePerToken)
                                ).toFixed(6)}{' '}
                                SOL + fees
                            </p>
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowBuy(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1'
                                    disabled={busy}
                                    onClick={() => buyListed(showBuy)}
                                >
                                    {busy ? '…' : 'Confirm'}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    )
}
