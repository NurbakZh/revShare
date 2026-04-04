import { getProgramId } from '@/lib/env'
import type { Idl } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import { BorshAccountsCoder } from '@coral-xyz/anchor'
import BN from 'bn.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import type { Connection, PublicKey } from '@solana/web3.js'

import rawIdl from './idl/revshare.json'

type Bn = InstanceType<typeof BN>

const TA_KEY = 'revshare:investorTokenAccount'

export function lamportsToSol(lamports: number): number {
    return lamports / 1_000_000_000
}

export function bpsToPercent(bps: number): number {
    return bps / 100
}

export function getRevshareIdl(): Idl {
    const idl = { ...(rawIdl as object) } as Idl
    idl.address = getProgramId().toBase58() as Idl['address']
    return idl
}

export function createRevshareProgram(provider: anchor.AnchorProvider) {
    return new anchor.Program(getRevshareIdl(), provider)
}

export type DecodedBusinessPool = {
    owner: PublicKey
    oracleAuthority: PublicKey
    tokenMint: PublicKey
    id: Bn
    totalTokens: Bn
    tokensSold: Bn
    revenueShareBps: number
    collateral: Bn
    tokenPrice: Bn
    currentEpoch: Bn
    totalDistributed: Bn
    isDefaulted: boolean
    raiseLimit: Bn
    fundsReleased: Bn
    targetRevenue: Bn
    bump: number
}

export type DecodedHolderClaim = {
    holder: PublicKey
    business: PublicKey
    tokenHeld: Bn
    lastClaimedEpoch: Bn
    totalClaimed: Bn
    bump: number
}

export type DecodedTokenListing = {
    seller: PublicKey
    business: PublicKey
    amount: Bn
    pricePerToken: Bn
    isActive: boolean
    bump: number
}

export type DecodedRevenueEpoch = {
    business: PublicKey
    epochNumber: Bn
    revenueAmount: Bn
    distributedAmount: Bn
    timestamp: Bn
    bump: number
}

function accountsCoder() {
    return new BorshAccountsCoder(getRevshareIdl())
}

export async function fetchBusinessPoolAccount(
    connection: Connection,
    businessPool: PublicKey,
): Promise<DecodedBusinessPool | null> {
    const coder = accountsCoder()
    const info = await connection.getAccountInfo(businessPool, 'confirmed')
    if (!info?.data) return null
    try {
        return coder.decode(
            'businessPool',
            info.data,
        ) as DecodedBusinessPool
    } catch {
        return null
    }
}

export async function fetchHolderClaimAccount(
    connection: Connection,
    holderClaim: PublicKey,
): Promise<DecodedHolderClaim | null> {
    const coder = accountsCoder()
    const info = await connection.getAccountInfo(holderClaim, 'confirmed')
    if (!info?.data) return null
    try {
        return coder.decode('holderClaim', info.data) as DecodedHolderClaim
    } catch {
        return null
    }
}

export async function fetchTokenListingAccount(
    connection: Connection,
    listingPda: PublicKey,
): Promise<DecodedTokenListing | null> {
    const coder = accountsCoder()
    const info = await connection.getAccountInfo(listingPda, 'confirmed')
    if (!info?.data) return null
    try {
        return coder.decode('tokenListing', info.data) as DecodedTokenListing
    } catch {
        return null
    }
}

export async function fetchRevenueEpochAccount(
    connection: Connection,
    epochPda: PublicKey,
): Promise<DecodedRevenueEpoch | null> {
    const coder = accountsCoder()
    const info = await connection.getAccountInfo(epochPda, 'confirmed')
    if (!info?.data) return null
    try {
        return coder.decode('revenueEpoch', info.data) as DecodedRevenueEpoch
    } catch {
        return null
    }
}

export function getStoredInvestorTokenAccount(
    businessPool: string,
): string | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(TA_KEY)
        if (!raw) return null
        const map = JSON.parse(raw) as Record<string, string>
        return map[businessPool] ?? null
    } catch {
        return null
    }
}

export function setStoredInvestorTokenAccount(
    businessPool: string,
    tokenAccount: string,
): void {
    if (typeof window === 'undefined') return
    try {
        const raw = localStorage.getItem(TA_KEY)
        const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
        map[businessPool] = tokenAccount
        localStorage.setItem(TA_KEY, JSON.stringify(map))
    } catch {
        return
    }
}

export async function findEscrowTokenAccountForListing(
    connection: Connection,
    listingPda: PublicKey,
    mint: PublicKey,
): Promise<PublicKey | null> {
    const res = await connection.getParsedTokenAccountsByOwner(listingPda, {
        mint,
        programId: TOKEN_PROGRAM_ID,
    })
    if (!res.value.length) return null
    return res.value[0]!.pubkey
}
