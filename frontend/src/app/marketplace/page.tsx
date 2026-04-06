'use client';

import { GlassCard } from '@/components/GlassCard';
import { PurchaseSuccessModal } from '@/components/PurchaseSuccessModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { fetchBusiness, fetchBusinesses, fetchMarketplaceListings } from '@/lib/api/oracle';
import type { TokenListingDto } from '@/lib/api/types';
import {
    fetchBusinessPoolAccount,
    fetchHolderClaimAccount,
    fetchTokenListingAccount,
    findEscrowTokenAccountForListing,
    lamportsToSol,
    setStoredInvestorTokenAccount,
} from '@/lib/solana/helpers'
import {
    getHolderClaimPda,
    getTokenListingPda,
    getTokenMintPda,
} from '@/lib/solana/pda'
import { getSolanaExplorerTxUrl } from '@/lib/env'
import { useAppStore } from '@/lib/store'
import { useRevshareProgram } from '@/lib/solana/useRevshareProgram'
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
} from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { Plus, Search, ShoppingCart, Tag, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

type Row = TokenListingDto & { businessName?: string };

type SellHolding = {
    poolPubkey: string
    name: string
    tokens: number
}

const LAMPORTS_PER_SOL = 1_000_000_000

function solToLamports(sol: number): number {
    if (!Number.isFinite(sol) || sol <= 0) return 0
    return Math.floor(sol * LAMPORTS_PER_SOL)
}

export default function MarketplacePage() {
    const { connection } = useConnection()
    const { publicKey } = useWallet();
    const program = useRevshareProgram();
    const role = useAppStore((s) => s.role)
    const [searchQuery, setSearchQuery] = useState('');
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [showBuy, setShowBuy] = useState<Row | null>(null);
    const [purchaseDone, setPurchaseDone] = useState<{
        signature: string;
        tokens: number;
        totalSol: number;
        businessName: string;
    } | null>(null);
    const [showSell, setShowSell] = useState(false);
    const [sellHoldings, setSellHoldings] = useState<SellHolding[]>([]);
    const [sellHoldingsLoading, setSellHoldingsLoading] = useState(false);
    const [sellPoolPubkey, setSellPoolPubkey] = useState('');
    const [sellAmount, setSellAmount] = useState(1);
    const [sellPriceSol, setSellPriceSol] = useState('');
    const [sellErr, setSellErr] = useState<string | null>(null);
    const [listSuccessSig, setListSuccessSig] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetchMarketplaceListings();
        if (!res.success) {
            setErr(res.error || 'Request failed');
            setRows([]);
            setLoading(false);
            return;
        }
        const active = (res.data ?? []).filter((l) => l.status === 0);
        const names = await Promise.all(
            active.map((l) => fetchBusiness(l.businessPubkey)),
        );
        const enriched: Row[] = active.map((l, i) => {
            const b = names[i];
            return {
                ...l,
                businessName: b?.success && b.data ? b.data.name : undefined,
            };
        });
        setRows(enriched);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const loadSellHoldings = useCallback(async () => {
        if (!publicKey) {
            setSellHoldings([]);
            return;
        }
        setSellHoldingsLoading(true);
        setSellErr(null);
        try {
            const res = await fetchBusinesses();
            let out: SellHolding[] = [];
            if (res.success && res.data) {
                const rows = await Promise.all(
                    res.data.map(async (b) => {
                        const poolPk = new PublicKey(b.pubkey);
                        const [claimPk] = getHolderClaimPda(poolPk, publicKey);
                        const claim = await fetchHolderClaimAccount(
                            connection,
                            claimPk,
                        );
                        if (!claim || claim.tokenHeld.isZero()) return null;
                        return {
                            poolPubkey: b.pubkey,
                            name: b.name,
                            tokens: claim.tokenHeld.toNumber(),
                        };
                    }),
                );
                out = rows.filter((x): x is SellHolding => x != null);
            }
            setSellHoldings(out);
            setSellPoolPubkey((prev) => {
                if (out.length === 0) return '';
                if (prev && out.some((h) => h.poolPubkey === prev)) {
                    return prev;
                }
                return out[0].poolPubkey;
            });
        } catch (e) {
            setSellErr(
                e instanceof Error ? e.message : 'Could not load your holdings',
            );
            setSellHoldings([]);
        } finally {
            setSellHoldingsLoading(false);
        }
    }, [connection, publicKey]);

    function openSellModal() {
        setShowSell(true);
        setSellErr(null);
        setListSuccessSig(null);
        setSellAmount(1);
        setSellPriceSol('');
        void loadSellHoldings();
    }

    async function submitListTokens() {
        if (!program || !publicKey) return;
        const holding = sellHoldings.find((h) => h.poolPubkey === sellPoolPubkey);
        if (!holding) {
            setSellErr('Choose a business pool');
            return;
        }
        const priceSol = Number.parseFloat(sellPriceSol.replace(',', '.'));
        const priceLamports = solToLamports(priceSol);
        if (!Number.isFinite(priceSol) || priceLamports <= 0) {
            setSellErr('Enter a valid price per token (SOL)');
            return;
        }
        if (!Number.isInteger(sellAmount) || sellAmount < 1) {
            setSellErr('Amount must be a positive integer');
            return;
        }
        if (sellAmount > holding.tokens) {
            setSellErr(`You only hold ${holding.tokens} tokens in this pool`);
            return;
        }
        setBusy(true);
        setSellErr(null);
        try {
            const businessPoolPda = new PublicKey(sellPoolPubkey);
            const pool = await fetchBusinessPoolAccount(
                connection,
                businessPoolPda,
            );
            if (!pool) throw new Error('Pool account not found');
            if (pool.owner.equals(publicKey)) {
                throw new Error('Business owner cannot list tokens');
            }
            const [tokenMintPda] = getTokenMintPda(businessPoolPda);
            const [tokenListingPda] = getTokenListingPda(
                businessPoolPda,
                publicKey,
            );
            const listingInfo = await connection.getAccountInfo(
                tokenListingPda,
                'confirmed',
            );
            if (listingInfo?.data?.length) {
                const existing = await fetchTokenListingAccount(
                    connection,
                    tokenListingPda,
                );
                if (existing?.isActive) {
                    throw new Error(
                        'You already have an active listing for this pool. Cancel it first.',
                    );
                }
                throw new Error(
                    'A listing account exists for this pool. Cancel it before creating a new one.',
                );
            }
            const sellerTokenAccount = await getAssociatedTokenAddress(
                tokenMintPda,
                publicKey,
            );
            const escrowKp = Keypair.generate();
            const sig = await program.methods
                .listTokens(new BN(sellAmount), new BN(priceLamports))
                .accounts({
                    seller: publicKey,
                    businessPool: businessPoolPda,
                    tokenMint: tokenMintPda,
                    tokenListing: tokenListingPda,
                    sellerTokenAccount,
                    escrowTokenAccount: escrowKp.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([escrowKp])
                .rpc();
            setListSuccessSig(sig);
            setShowSell(false);
            await load();
        } catch (e) {
            setSellErr(e instanceof Error ? e.message : 'Listing failed');
        } finally {
            setBusy(false);
        }
    }

    const filtered = rows.filter((r) =>
        (r.businessName || r.businessPubkey)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
    );

    async function buyListed(row: Row) {
        if (!program || !publicKey) return;
        setBusy(true);
        setErr(null);
        try {
            const businessPoolPda = new PublicKey(row.businessPubkey);
            const poolAcc = await fetchBusinessPoolAccount(
                program.provider.connection,
                businessPoolPda,
            );
            if (!poolAcc) throw new Error('Pool missing');
            const [tokenMintPda] = getTokenMintPda(businessPoolPda);
            const listingPda = new PublicKey(row.listingPubkey);
            const listing = await fetchTokenListingAccount(
                program.provider.connection,
                listingPda,
            );
            if (!listing) throw new Error('Listing missing');
            const seller = listing.seller;
            const escrow = await findEscrowTokenAccountForListing(
                program.provider.connection,
                listingPda,
                tokenMintPda,
            );
            if (!escrow) throw new Error('Escrow not found');
            const [buyerClaimPda] = getHolderClaimPda(
                businessPoolPda,
                publicKey,
            )
            const buyerTokenAccount = await getAssociatedTokenAddress(
                tokenMintPda,
                publicKey,
            )
            const totalLamports = listing.amount.mul(listing.pricePerToken)
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
            setShowBuy(null)
            setPurchaseDone({
                signature: sig,
                tokens: listing.amount.toNumber(),
                totalSol: totalSolPaid,
                businessName: row.businessName ?? 'Business',
            })
            await load()
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Buy failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className='container mx-auto px-4 py-8 '>
            <PurchaseSuccessModal
                open={!!purchaseDone}
                onClose={() => setPurchaseDone(null)}
                businessName={purchaseDone?.businessName ?? ''}
                tokens={purchaseDone?.tokens ?? 0}
                totalSol={purchaseDone?.totalSol ?? 0}
                signature={purchaseDone?.signature ?? ''}
                variantLabel='Marketplace listing'
            />
            <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <h1 className='mb-2 text-4xl font-bold text-foreground'>
                        Token marketplace
                    </h1>
                    <p className='text-muted-foreground'>
                        Listings from API, settlement on-chain
                    </p>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    {role === 'investor' && (
                        <Button
                            type='button'
                            variant='outline'
                            size='lg'
                            disabled={!publicKey}
                            title={
                                !publicKey
                                    ? 'Connect wallet to list tokens'
                                    : undefined
                            }
                            onClick={openSellModal}
                        >
                            <Tag size={20} className='mr-2' />
                            Sell tokens
                        </Button>
                    )}
                    <Button variant='brand' size='lg' asChild>
                        <Link href='/'>
                            <Plus size={20} className='mr-2' />
                            Buy from catalog
                        </Link>
                    </Button>
                </div>
            </div>

            {listSuccessSig && (
                <p className='mb-4 text-sm text-green-500'>
                    Listing published.{' '}
                    <a
                        href={getSolanaExplorerTxUrl(listSuccessSig)}
                        target='_blank'
                        rel='noreferrer'
                        className='font-mono underline'
                    >
                        View transaction
                    </a>
                </p>
            )}

            {err && <p className='mb-4 text-sm text-red-500'>{err}</p>}

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
                                            listing.businessPubkey.slice(0, 8) +
                                                '…'}
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
                                                !program || !publicKey || busy
                                            }
                                            onClick={() => setShowBuy(listing)}
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

            {showSell && (
                <div
                    className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-lg'
                    onClick={() => setShowSell(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GlassCard className='max-w-md p-8'>
                            <h2 className='mb-2 text-xl font-bold text-foreground'>
                                List tokens for sale
                            </h2>
                            <p className='mb-6 text-sm text-muted-foreground'>
                                Tokens move to an on-chain escrow. One active
                                listing per business pool.
                            </p>
                            {sellHoldingsLoading ? (
                                <p className='text-muted-foreground'>Loading…</p>
                            ) : sellHoldings.length === 0 ? (
                                <p className='mb-4 text-sm text-muted-foreground'>
                                    No token holdings found. Buy tokens from the
                                    catalog first, then you can resell them here.
                                </p>
                            ) : (
                                <>
                                    <div className='mb-4'>
                                        <Label htmlFor='sell-pool'>
                                            Business pool
                                        </Label>
                                        <Select
                                            value={sellPoolPubkey}
                                            onValueChange={setSellPoolPubkey}
                                        >
                                            <SelectTrigger
                                                id='sell-pool'
                                                className='mt-2'
                                            >
                                                <SelectValue placeholder='Choose business pool' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sellHoldings.map((h) => (
                                                    <SelectItem
                                                        key={h.poolPubkey}
                                                        value={h.poolPubkey}
                                                    >
                                                        {h.name} (you hold{' '}
                                                        {h.tokens})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className='mb-4'>
                                        <Label htmlFor='sell-amt' required>
                                            Amount (tokens)
                                        </Label>
                                        <Input
                                            id='sell-amt'
                                            type='number'
                                            min={1}
                                            max={
                                                sellHoldings.find(
                                                    (x) =>
                                                        x.poolPubkey ===
                                                        sellPoolPubkey,
                                                )?.tokens ?? 1
                                            }
                                            value={sellAmount}
                                            onChange={(e) =>
                                                setSellAmount(
                                                    Number.parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className='mt-2'
                                        />
                                    </div>
                                    <div className='mb-6'>
                                        <Label htmlFor='sell-price' required>
                                            Price per token (SOL)
                                        </Label>
                                        <Input
                                            id='sell-price'
                                            type='text'
                                            inputMode='decimal'
                                            placeholder='0.01'
                                            value={sellPriceSol}
                                            onChange={(e) =>
                                                setSellPriceSol(e.target.value)
                                            }
                                            className='mt-2'
                                        />
                                    </div>
                                </>
                            )}
                            {sellErr && (
                                <p className='mb-4 text-sm text-red-500'>
                                    {sellErr}
                                </p>
                            )}
                            <div className='flex gap-3'>
                                <Button
                                    variant='outline'
                                    className='flex-1'
                                    onClick={() => setShowSell(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant='brand'
                                    className='flex-1'
                                    disabled={
                                        busy ||
                                        !program ||
                                        !publicKey ||
                                        sellHoldingsLoading ||
                                        sellHoldings.length === 0
                                    }
                                    onClick={() => void submitListTokens()}
                                >
                                    {busy ? '…' : 'Create listing'}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

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
    );
}
