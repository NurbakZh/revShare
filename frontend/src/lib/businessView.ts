import type { BusinessProfile, RevenueRecord } from '@/lib/api/types'
import type { Business } from '@/lib/data'
import type { DecodedBusinessPool } from '@/lib/solana/helpers'
import { lamportsToSol } from '@/lib/solana/helpers'

const RANK_RISK: Record<number, Business['riskLevel']> = {
    0: 'Medium',
    1: 'Low',
    2: 'Low',
    3: 'Low',
}

function logoFromProfile(p: BusinessProfile): string {
    if (p.logoUrl?.trim()) return p.logoUrl.trim()
    const c = p.name.trim().charAt(0)
    return c ? c.toUpperCase() : ''
}

export function profileToBusiness(
    p: BusinessProfile,
    pool?: DecodedBusinessPool | null,
    revenueHistory?: RevenueRecord[],
): Business {
    const monthlyRevenue =
        revenueHistory && revenueHistory.length > 0
            ? revenueHistory.map((r) => lamportsToSol(r.amount))
            : []

    if (!pool) {
        return {
            id: p.pubkey,
            pubkey: p.pubkey,
            name: p.name,
            description: p.description,
            category: p.city?.trim() ?? '',
            apy: 0,
            riskLevel: p.hasDefaulted ? 'High' : RANK_RISK[p.rank] ?? 'Medium',
            tokenPrice: 0,
            totalTokens: 0,
            tokensLeft: 0,
            fundingProgress: 0,
            monthlyRevenue,
            logo: logoFromProfile(p),
            owner: `${p.ownerPubkey.slice(0, 4)}…${p.ownerPubkey.slice(-4)}`,
            revenueSharePercent: 0,
            targetRevenue: Math.round(lamportsToSol(p.targetRevenue)),
        }
    }

    const totalTokens = pool.totalTokens.toNumber()
    const tokensSold = pool.tokensSold.toNumber()
    const tokensLeft = Math.max(0, totalTokens - tokensSold)
    const fundingProgress =
        totalTokens > 0 ? Math.min(100, (tokensSold / totalTokens) * 100) : 0
    const tokenPriceLamports = pool.tokenPrice.toNumber()
    const tokenPriceSol = lamportsToSol(tokenPriceLamports)
    const revenueSharePercent = pool.revenueShareBps / 100

    const totalRaisedLamports = tokensSold * tokenPriceLamports
    const apy =
        totalRaisedLamports > 0
            ? Math.min(
                  99,
                  (lamportsToSol(pool.totalDistributed.toNumber()) *
                      12 *
                      100) /
                      lamportsToSol(totalRaisedLamports),
              )
            : 0

    return {
        id: p.pubkey,
        pubkey: p.pubkey,
        name: p.name,
        description: p.description,
        category: p.city?.trim() ?? '',
        apy: Math.round(apy * 10) / 10,
        riskLevel: p.hasDefaulted ? 'High' : RANK_RISK[p.rank] ?? 'Medium',
        tokenPrice: Math.round(tokenPriceSol * 10000) / 10000,
        totalTokens,
        tokensLeft,
        fundingProgress: Math.round(fundingProgress * 10) / 10,
        monthlyRevenue,
        logo: logoFromProfile(p),
        owner: `${p.ownerPubkey.slice(0, 4)}…${p.ownerPubkey.slice(-4)}`,
        revenueSharePercent,
        targetRevenue: Math.round(lamportsToSol(pool.targetRevenue.toNumber())),
    }
}
